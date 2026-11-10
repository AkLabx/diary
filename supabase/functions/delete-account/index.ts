// Deno Supabase Edge Function: delete-account
// Cascades account deletion across auth.users, public tables, and storage buckets.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(JSON.stringify({ error: 'Server configuration error: missing Supabase credentials' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 1. Verify user's session with anon client + Authorization header
    const userClient = createClient(supabaseUrl, anonKey || serviceRoleKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid or expired token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const uid = user.id;
    console.log(`[delete-account] Commencing account purge for user: ${uid}`);

    // 2. Admin client with service role key for full cascade deletion
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // 3. Purge all private storage buckets
    const buckets = ['diary-images', 'diary-audio', 'avatars'];
    for (const bucket of buckets) {
      try {
        const { data: files, error: listError } = await adminClient.storage.from(bucket).list(uid);
        if (!listError && files && files.length > 0) {
          const filePaths = files.map(f => `${uid}/${f.name}`);
          console.log(`[delete-account] Removing ${filePaths.length} objects from bucket '${bucket}'`);
          await adminClient.storage.from(bucket).remove(filePaths);
        }
      } catch (storageErr) {
        console.error(`[delete-account] Error clearing storage bucket '${bucket}':`, storageErr);
      }
    }

    // 4. Delete user database records (media_files, diaries, profiles)
    try {
      await adminClient.from('media_files').delete().eq('user_id', uid);
      await adminClient.from('diaries').delete().eq('owner_id', uid);
      await adminClient.from('profiles').delete().eq('id', uid);
    } catch (dbErr) {
      console.error('[delete-account] Database cleanup warning:', dbErr);
    }

    // 5. Delete user from Supabase Auth
    const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(uid);
    if (deleteAuthError) {
      console.error('[delete-account] Error deleting auth user:', deleteAuthError);
      return new Response(JSON.stringify({ error: deleteAuthError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`[delete-account] User ${uid} successfully purged from database, storage, and auth.`);
    return new Response(JSON.stringify({
      success: true,
      message: 'Account and all associated encrypted data permanently deleted.'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err: any) {
    console.error('[delete-account] Unexpected exception:', err);
    return new Response(JSON.stringify({ error: err?.message || 'Internal Server Error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
