import { supabase } from './supabaseClient';
import { Profile } from '../types';

export const KEY_CHECK_STRING = "DAILY_DIARY_KEY_CHECK_v1";

// --- Helper Functions ---
const encodeBase64 = (buf: ArrayBuffer): string => btoa(String.fromCharCode(...new Uint8Array(buf)));
const decodeBase64 = (str: string): ArrayBuffer => Uint8Array.from(atob(str), c => c.charCodeAt(0)).buffer;
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
 * @param {string} password The user's password.
 * @param {string} salt The base64 encoded salt.
 * @returns {Promise<CryptoKey>} The derived AES-GCM key.
 */
export const deriveKey = async (password: string, salt: string): Promise<CryptoKey> => {
  const passwordBuffer = textEncoder.encode(password);
  const saltBuffer = decodeBase64(salt);
  
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
      iterations: 100000,
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