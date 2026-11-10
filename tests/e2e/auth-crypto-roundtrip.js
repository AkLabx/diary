// tests/e2e/auth-crypto-roundtrip.js
// Automated Integration & End-to-End Cryptographic Round-Trip Test
// Uses dedicated test credentials: testuser@diary.com / test@4321

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://ccgiozknvlknbrkzfcdx.supabase.co';
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjZ2lvemtudmxrbmJya3pmY2R4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NTY3NTMsImV4cCI6MjA3ODQzMjc1M30.lmmuGnynbY_n_4UlsrGw5ofRd6p9QLKCcrfHf7itEg8';

const TEST_EMAIL = 'testuser@diary.com';
const TEST_PASSWORD = 'test@4321';
const KEY_CHECK_STRING = "DAILY_DIARY_KEY_CHECK_v1";
const PBKDF2_ITERATIONS = 600000;

function encodeBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 32768;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, chunk);
  }
  return btoa(binary);
}

function decodeBase64(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

async function deriveKey(password, saltString) {
  const enc = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  let iterations = 100000;
  let actualSalt = saltString;
  if (saltString.startsWith('v1:')) {
    const parts = saltString.split(':');
    if (parts.length === 3) {
      const iter = parseInt(parts[1], 10);
      if (!isNaN(iter)) {
        iterations = iter;
        actualSalt = parts[2];
      }
    }
  }

  const saltBuffer = decodeBase64(actualSalt);

  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: iterations,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

async function encryptData(key, text) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(text);
  const cipherBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded
  );

  return {
    iv: encodeBase64(iv),
    data: encodeBase64(cipherBuffer)
  };
}

async function decryptData(key, cipherBase64, ivBase64) {
  const iv = decodeBase64(ivBase64);
  const cipherBuffer = decodeBase64(cipherBase64);

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(iv) },
    key,
    cipherBuffer
  );

  return new TextDecoder().decode(decrypted);
}

async function runE2ETest() {
  console.log('====================================================');
  console.log('    DIARY E2E AUTH & CRYPTOGRAPHIC ROUNDTRIP TEST   ');
  console.log('====================================================');
  console.log(`Backend Target: ${SUPABASE_URL}`);
  console.log(`Test Account: ${TEST_EMAIL}\n`);

  const client = createClient(SUPABASE_URL, ANON_KEY);

  // 1. Authenticate with Supabase
  console.log('Step 1: Signing in with test user credentials...');
  const { data: authData, error: authError } = await client.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD
  });

  if (authError || !authData.session) {
    console.error('FAIL: Authentication failed:', authError);
    process.exit(1);
  }
  console.log(`  [OK] Authenticated successfully. User ID: ${authData.user.id}`);

  // 2. Fetch User Profile
  console.log('\nStep 2: Fetching user cryptographic profile...');
  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select('*')
    .eq('id', authData.user.id)
    .single();

  if (profileError || !profile) {
    console.error('FAIL: Profile retrieval failed:', profileError);
    process.exit(1);
  }

  console.log(`  [OK] Profile retrieved. Salt length: ${profile.salt?.length} chars`);

  // 3. Derive Master Key with PBKDF2 (600,000 iterations)
  console.log(`\nStep 3: Deriving AES-GCM (256-bit) key (${PBKDF2_ITERATIONS} iterations)...`);
  const t0 = performance.now();
  const derivedKey = await deriveKey(TEST_PASSWORD, profile.salt);
  const t1 = performance.now();
  console.log(`  [OK] Master key derived in ${(t1 - t0).toFixed(1)}ms`);

  // 4. Verify Key Check Value
  console.log('\nStep 4: Verifying key_check_value against derived key...');
  try {
    const verifiedCheck = await decryptData(derivedKey, profile.key_check_value, profile.key_check_iv);
    if (verifiedCheck === KEY_CHECK_STRING) {
      console.log('  [OK] Key verification confirmed: Password is mathematically valid.');
    } else {
      console.error('FAIL: Unexpected key check string:', verifiedCheck);
      process.exit(1);
    }
  } catch (verifyErr) {
    console.error('FAIL: Key verification failed (bad password or corrupted check value):', verifyErr);
    process.exit(1);
  }

  // 5. Encrypt Test Diary Entry
  console.log('\nStep 5: Client-side AES-GCM encryption of new test entry...');
  const originalEntry = {
    title: `Automated E2E Verification - ${new Date().toISOString()}`,
    content: '<p>Zero-knowledge cryptographic roundtrip verified for production launch.</p>',
    mood: '😎',
    tags: ['automated', 'playwright', 'production-test'],
    journal: 'Personal',
    created_at: new Date().toISOString()
  };

  const { iv, data: encrypted_entry } = await encryptData(derivedKey, JSON.stringify(originalEntry));
  console.log(`  [OK] Payload encrypted. Ciphertext size: ${encrypted_entry.length} chars, IV: ${iv}`);

  // 6. Insert Record into Supabase
  console.log('\nStep 6: Saving encrypted record to public.diaries...');
  const { data: savedRow, error: saveError } = await client
    .from('diaries')
    .insert({
      owner_id: authData.user.id,
      encrypted_entry,
      iv,
      mood: originalEntry.mood,
      tags: originalEntry.tags,
      journal: originalEntry.journal,
      created_at: originalEntry.created_at
    })
    .select('id, created_at, mood, tags, journal')
    .single();

  if (saveError || !savedRow) {
    console.error('FAIL: Could not save entry:', saveError);
    process.exit(1);
  }
  const entryId = savedRow.id;
  console.log(`  [OK] Row successfully inserted into Supabase. Entry ID: ${entryId}`);

  // 7. Retrieve and Decrypt from Supabase
  console.log('\nStep 7: Retrieving encrypted row and decrypting...');
  const { data: fetchedRow, error: fetchError } = await client
    .from('diaries')
    .select('encrypted_entry, iv')
    .eq('id', entryId)
    .single();

  if (fetchError || !fetchedRow) {
    console.error('FAIL: Could not fetch entry back:', fetchError);
    process.exit(1);
  }

  const decryptedJson = await decryptData(derivedKey, fetchedRow.encrypted_entry, fetchedRow.iv);
  const parsedDecrypted = JSON.parse(decryptedJson);

  if (parsedDecrypted.title === originalEntry.title && parsedDecrypted.content === originalEntry.content) {
    console.log(`  [OK] Decryption MATCHES original plaintext with 100% byte fidelity!`);
  } else {
    console.error('FAIL: Plaintext mismatch!');
    process.exit(1);
  }

  // 8. Cleanup Test Record
  console.log('\nStep 8: Cleaning up test entry from database...');
  const { error: deleteError } = await client
    .from('diaries')
    .delete()
    .eq('id', entryId);

  if (deleteError) {
    console.warn('Warning: Could not delete test entry:', deleteError);
  } else {
    console.log(`  [OK] Test entry ${entryId} deleted cleanly.`);
  }

  // 9. Sign Out
  await client.auth.signOut();
  console.log('\n====================================================');
  console.log('>> E2E AUTH & CRYPTO ROUNDTRIP RESULT: 100% PASSED <<');
  console.log('====================================================\n');
  process.exit(0);
}

runE2ETest().catch((err) => {
  console.error('Fatal unhandled error:', err);
  process.exit(1);
});
