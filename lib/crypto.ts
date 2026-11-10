import { supabase } from './supabaseClient';
import { Profile } from '../types';

export const KEY_CHECK_STRING = "DAILY_DIARY_KEY_CHECK_v1";

// --- Helper Functions ---
// Chunked base64 encoder to avoid "RangeError: Maximum call stack size exceeded" on buffers > 64 KB.
export const encodeBase64 = (buf: ArrayBufferLike): string => {
  const bytes = new Uint8Array(buf);
  const len = bytes.byteLength;
  const chunkSize = 0x8000; // 32,768 bytes safe chunk size
  let binary = '';
  for (let i = 0; i < len; i += chunkSize) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, Math.min(i + chunkSize, len)) as unknown as number[]);
  }
  return btoa(binary);
};

// Fast and stack-safe base64 decoder avoiding Uint8Array.from callback overhead on large payloads.
export const decodeBase64 = (str: string): ArrayBuffer => {
  const binary = atob(str);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer as ArrayBuffer;
};
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

// --- Core Crypto Functions ---

/**
 * Generates a cryptographically secure random salt.
 * @returns {string} A base64 encoded salt.
 */
export const generateSalt = (): string => {
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  return encodeBase64(salt.buffer);
};

/**
 * Derives a CryptoKey from a password and salt using PBKDF2.
 * Supports legacy salt (pure base64, 100k iterations) and new format "v1:iterations:base64salt".
 * @param {string} password The user's password.
 * @param {string} saltString The salt string (base64 or formatted).
 * @returns {Promise<CryptoKey>} The derived AES-GCM key.
 */
export const deriveKey = async (password: string, saltString: string): Promise<CryptoKey> => {
  const passwordBuffer = textEncoder.encode(password);
  
  // Default to legacy iteration count
  let iterations = 100000;
  let actualSalt = saltString;

  // Check for versioned salt format to support higher iteration counts
  // Format: "v1:iterations:base64Salt"
  // Base64 does not contain ':', so this check is safe.
  if (saltString.startsWith("v1:")) {
    const parts = saltString.split(":");
    if (parts.length === 3) {
       const iter = parseInt(parts[1], 10);
       if (!isNaN(iter)) {
         iterations = iter;
         actualSalt = parts[2];
       }
    }
  }

  const saltBuffer = decodeBase64(actualSalt);
  
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
};


/**
 * Encrypts a plaintext string using AES-GCM.
 * @param {CryptoKey} key The encryption key.
 * @param {string} plaintext The string to encrypt.
 * @returns {Promise<{ iv: string, data: string }>} The base64 encoded IV and encrypted data.
 */
export const encrypt = async (key: CryptoKey, plaintext: string): Promise<{ iv: string, data: string }> => {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const plaintextBuffer = textEncoder.encode(plaintext);

  const encryptedData = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    plaintextBuffer
  );

  return {
    iv: encodeBase64(iv.buffer),
    data: encodeBase64(encryptedData),
  };
};

/**
 * Decrypts a ciphertext string using AES-GCM.
 * @param {CryptoKey} key The decryption key.
 * @param {string} ciphertext The base64 encoded data to decrypt.
 * @param {string} iv The base64 encoded Initialization Vector.
 * @returns {Promise<string>} The decrypted plaintext string.
 */
export const decrypt = async (key: CryptoKey, ciphertext: string, iv: string): Promise<string> => {
  const ivBuffer = decodeBase64(iv);
  const ciphertextBuffer = decodeBase64(ciphertext);

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivBuffer },
    key,
    ciphertextBuffer
  );

  return textDecoder.decode(decryptedBuffer);
};

/**
 * Encrypts binary data (ArrayBuffer) using AES-GCM.
 * @param {CryptoKey} key The encryption key.
 * @param {ArrayBuffer} data The binary data to encrypt.
 * @returns {Promise<{ iv: string, data: ArrayBuffer }>} The base64 encoded IV and encrypted binary data.
 */
export const encryptBinary = async (key: CryptoKey, data: ArrayBuffer): Promise<{ iv: string, data: ArrayBuffer }> => {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const encryptedData = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );

  return {
    iv: encodeBase64(iv.buffer),
    data: encryptedData,
  };
};

/**
 * Decrypts binary data (ArrayBuffer) using AES-GCM.
 * @param {CryptoKey} key The decryption key.
 * @param {ArrayBuffer} data The encrypted binary data.
 * @param {string} iv The base64 encoded Initialization Vector.
 * @returns {Promise<ArrayBuffer>} The decrypted binary data.
 */
export const decryptBinary = async (key: CryptoKey, data: ArrayBuffer, iv: string): Promise<ArrayBuffer> => {
  const ivBuffer = decodeBase64(iv);

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivBuffer },
    key,
    data
  );

  return decryptedBuffer;
};

/**
 * Fetches user profile, derives key, and verifies it.
 * @param password The user's password.
 * @param userId The user's ID.
 * @returns The derived CryptoKey if successful, otherwise null.
 */
export async function deriveAndVerifyKey(password: string, userId: string): Promise<CryptoKey | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error || !data) {
    console.error("Profile not found for user:", userId);
    return null;
  }
  
  const profile = data as Profile;

  try {
    const key = await deriveKey(password, profile.salt);
    const decryptedCheck = await decrypt(key, profile.key_check_value, profile.key_check_iv);

    if (decryptedCheck === KEY_CHECK_STRING) {
      return key;
    }
    return null;
  } catch (e) {
    console.error("Key derivation or verification failed:", e);
    return null;
  }
}

/**
 * Exports the raw key material to a base64 string.
 * IMPORTANT: This should only be used for generating the recovery kit.
 * @param key The CryptoKey to export
 * @returns Base64 string of the raw key
 */
export const exportKey = async (key: CryptoKey): Promise<string> => {
  const exported = await window.crypto.subtle.exportKey("raw", key);
  return encodeBase64(exported);
};

/**
 * Imports a raw key back into a CryptoKey.
 * Used for biometric unlock logic.
 * @param rawKeyBase64 The base64 encoded raw key.
 * @returns Promise resolving to CryptoKey
 */
export const importKey = async (rawKeyBase64: string): Promise<CryptoKey> => {
    const rawBuffer = decodeBase64(rawKeyBase64);
    return window.crypto.subtle.importKey(
        "raw",
        rawBuffer,
        { name: "AES-GCM" },
        true,
        ["encrypt", "decrypt"]
    );
};

/**
 * Derives a deterministic HMAC-SHA256 blind index for searching tags/terms
 * without leaking raw plaintext to the database server.
 */
export const deriveBlindIndex = async (key: CryptoKey, term: string): Promise<string> => {
  const rawKey = await window.crypto.subtle.exportKey("raw", key);
  const hmacKey = await window.crypto.subtle.importKey(
    "raw",
    rawKey,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await window.crypto.subtle.sign(
    "HMAC",
    hmacKey,
    textEncoder.encode(term.toLowerCase().trim())
  );
  return encodeBase64(signature).slice(0, 32);
};
