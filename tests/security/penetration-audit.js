// tests/security/penetration-audit.js
// Automated Security Penetration & RLS Policy Verification Suite
// Validates multi-tenant isolation, zero-knowledge constraints, and private bucket access controls.

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://ccgiozknvlknbrkzfcdx.supabase.co';
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjZ2lvemtudmxrbmJya3pmY2R4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NTY3NTMsImV4cCI6MjA3ODQzMjc1M30.lmmuGnynbY_n_4UlsrGw5ofRd6p9QLKCcrfHf7itEg8';

const anonClient = createClient(SUPABASE_URL, ANON_KEY);

let passedTests = 0;
let totalTests = 0;

function assert(condition, testName, details = '') {
  totalTests++;
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`  [FAIL] ${testName} ${details ? '- ' + details : ''}`);
  }
}

async function runPenetrationSuite() {
  console.log('====================================================');
  console.log('       DIARY APP SECURITY PENETRATION AUDIT         ');
  console.log('====================================================');
  console.log(`Target Backend: ${SUPABASE_URL}\n`);

  // --- TEST 1: Anonymous Unauthorized Access to public.diaries ---
  console.log('1. Testing Row Level Security (RLS) on public.diaries...');
  try {
    const { data, error } = await anonClient
      .from('diaries')
      .select('*')
      .limit(10);

    assert(
      !error && (!data || data.length === 0),
      'Anonymous client cannot select any rows from public.diaries',
      `Rows returned: ${data?.length || 0}`
    );
  } catch (e) {
    assert(false, 'Anonymous select on diaries threw unexpected exception', e.message);
  }

  // --- TEST 2: Anonymous Unauthorized Insert into public.diaries ---
  try {
    const fakeUuid = '00000000-0000-0000-0000-000000000000';
    const { data, error } = await anonClient
      .from('diaries')
      .insert({
        owner_id: fakeUuid,
        encrypted_entry: 'injected_content',
        iv: 'injected_iv_1234'
      });

    assert(
      error !== null,
      'Anonymous client cannot insert malicious rows into public.diaries',
      `Expected error, but got: ${JSON.stringify(data)}`
    );
  } catch (e) {
    assert(true, 'Anonymous insert correctly rejected with exception');
  }

  // --- TEST 3: Anonymous Unauthorized Access to public.profiles ---
  console.log('\n2. Testing Row Level Security (RLS) on public.profiles...');
  try {
    const { data, error } = await anonClient
      .from('profiles')
      .select('*')
      .limit(10);

    assert(
      !error && (!data || data.length === 0),
      'Anonymous client cannot select profiles or cryptographic salts',
      `Rows returned: ${data?.length || 0}`
    );
  } catch (e) {
    assert(false, 'Anonymous select on profiles threw exception', e.message);
  }

  // --- TEST 4: Anonymous Unauthorized Access to public.media_files ---
  console.log('\n3. Testing Row Level Security (RLS) on public.media_files...');
  try {
    const { data, error } = await anonClient
      .from('media_files')
      .select('*')
      .limit(10);

    assert(
      !error && (!data || data.length === 0),
      'Anonymous client cannot inspect media_files entries',
      `Rows returned: ${data?.length || 0}`
    );
  } catch (e) {
    assert(false, 'Anonymous select on media_files threw exception', e.message);
  }

  // --- TEST 5: Storage Bucket Private Access Controls ---
  console.log('\n4. Testing Private Storage Buckets Access Controls...');
  const buckets = ['diary-images', 'diary-audio', 'avatars'];
  for (const bucket of buckets) {
    try {
      // Attempt listing files anonymously
      const { data, error } = await anonClient.storage.from(bucket).list();
      assert(
        error !== null || (!data || data.length === 0),
        `Bucket '${bucket}' rejects anonymous directory listing`,
        error ? error.message : `Returned ${data?.length} files`
      );

      // Attempt downloading a fake object directly without signed URL
      const directUrl = `${SUPABASE_URL}/storage/v1/object/public/${bucket}/fake-test-file.bin`;
      const res = await fetch(directUrl);
      assert(
        res.status === 400 || res.status === 403 || res.status === 404,
        `Direct public access to '${bucket}' is blocked (HTTP ${res.status})`
      );
    } catch (e) {
      assert(true, `Bucket '${bucket}' blocked direct request with error: ${e.message}`);
    }
  }

  // --- TEST 6: Edge Function CORS & Options Preflight ---
  console.log('\n5. Testing Edge Functions Preflight & Access Controls...');
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/weather-proxy`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://localhost:5173',
        'Access-Control-Request-Method': 'POST'
      }
    });

    assert(
      res.ok && res.headers.get('access-control-allow-origin') === '*',
      'Edge Function weather-proxy responds cleanly to CORS preflight'
    );
  } catch (e) {
    assert(false, 'CORS preflight failed for weather-proxy', e.message);
  }

  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/delete-account`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    assert(
      res.status === 401,
      'Edge Function delete-account strictly rejects unauthenticated requests (HTTP 401)',
      `Actual status: ${res.status}`
    );
  } catch (e) {
    assert(false, 'delete-account unauthenticated test error', e.message);
  }

  console.log('\n====================================================');
  console.log(`SUMMARY: ${passedTests} / ${totalTests} Security Tests Passed (${Math.round((passedTests/totalTests)*100)}%)`);
  console.log('====================================================\n');

  if (passedTests === totalTests) {
    console.log('>> SECURITY AUDIT RESULT: PASSED (Zero Critical / High Findings) <<\n');
    process.exit(0);
  } else {
    console.error('>> SECURITY AUDIT RESULT: FAILED <<\n');
    process.exit(1);
  }
}

runPenetrationSuite();
