import { supabase } from './supabaseClient';
import { Profile } from '../types';

export const KEY_CHECK_STRING = "DAILY_DIARY_KEY_CHECK_v1";

// --- Helper Functions ---
// Fix: Change parameter type to ArrayBufferLike to handle buffers from Uint8Array.
export const encodeBase64 = (buf: ArrayBufferLike): string => btoa(String.fromCharCode(...new Uint8Array(buf)));
// Fix: Cast the result to ArrayBuffer to satisfy the return type. The .buffer property on a Uint8Array is typed as ArrayBufferLike.
export const decodeBase64 = (str: string): ArrayBuffer => Uint8Array.from(atob(str), c => c.charCodeAt(0)).buffer as ArrayBuffer;
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