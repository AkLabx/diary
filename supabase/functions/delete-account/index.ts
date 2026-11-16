// Deno Supabase Edge Function: delete-account
// Cascades account deletion across auth.users, public tables, and storage buckets.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

/**
 * Recursively collects all storage object paths under a prefix, handling pagination and nested directories.
 */
async function collectAllBucketPaths(adminClient: any, bucket: string, prefix: string): Promise<string[]> {
  const paths: string[] = [];
  let offset = 0;
  const limit = 100;

  let hasMore = true;
  while (hasMore) {
    const { data, error } = await adminClient.storage.from(bucket).list(prefix, { limit, offset });
    if (error) {
      throw new Error(`Storage list failed for ${bucket}/${prefix}: ${error.message}`);
    }
    if (!data || data.length === 0) {
      hasMore = false;
      break;
    }

    for (const item of data) {
      const fullPath = `${prefix}/${item.name}`;
      if (item.id === null) {
        // Subdirectory; recurse into it (e.g. task_attachments)
        const nestedPaths = await collectAllBucketPaths(adminClient, bucket, fullPath);
        paths.push(...nestedPaths);
      } else {
        paths.push(fullPath);
      }
    }

    if (data.length < limit) {
      hasMore = false;
    } else {
      offset += limit;
    }
  }

  return paths;
}

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

    // 3. Purge all private storage buckets recursively
    const buckets = ['diary-images', 'diary-audio', 'avatars'];
    for (const bucket of buckets) {
      const filePaths = await collectAllBucketPaths(adminClient, bucket, uid);
      if (filePaths.length > 0) {
        console.log(`[delete-account] Removing ${filePaths.length} objects from bucket '${bucket}'`);
        // Remove objects in chunks of 100 to avoid payload size limits
        const chunkSize = 100;
        for (let i = 0; i < filePaths.length; i += chunkSize) {
          const chunk = filePaths.slice(i, i + chunkSize);
          const { error: removeError } = await adminClient.storage.from(bucket).remove(chunk);
          if (removeError) {
            throw new Error(`Failed to remove objects from bucket '${bucket}': ${removeError.message}`);
          }
        }
      }
    }

    // 4. Delete user database records across all user tables and task tables
    const tableCleanups: Array<{ name: string; deleteFn: () => Promise<any> }> = [
      { name: 'task_attachments', deleteFn: () => adminClient.from('task_attachments').delete().eq('owner_id', uid) },
      { name: 'task_history', deleteFn: () => adminClient.from('task_history').delete().eq('owner_id', uid) },
      { name: 'personal_tasks', deleteFn: () => adminClient.from('personal_tasks').delete().eq('owner_id', uid) },
      { name: 'task_templates', deleteFn: () => adminClient.from('task_templates').delete().eq('owner_id', uid) },
      { name: 'media_files', deleteFn: () => adminClient.from('media_files').delete().eq('user_id', uid) },
      { name: 'diaries', deleteFn: () => adminClient.from('diaries').delete().eq('owner_id', uid) },
      { name: 'profiles', deleteFn: () => adminClient.from('profiles').delete().eq('id', uid) },
    ];

    for (const table of tableCleanups) {
      const { error: dbError } = await table.deleteFn();
      if (dbError) {
        console.warn(`[delete-account] Warning while deleting from ${table.name}:`, dbError);
      }
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
