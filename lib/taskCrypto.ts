import { encodeBase64, decodeBase64 } from './crypto';
import { DecryptedTaskPayload } from '../types';

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

/**
 * Computes a SHA-256 integrity checksum of a plaintext string.
 */
export async function computeChecksum(plaintext: string): Promise<string> {
  const data = textEncoder.encode(plaintext);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  return encodeBase64(hashBuffer);
}

/**
 * Encrypts a task payload using AES-GCM 256-bit with Authenticated Additional Data (AAD).
 */
export async function encryptTaskPayload(
  key: CryptoKey,
  payload: DecryptedTaskPayload,
  meta: { taskId: string; ownerId: string; version: number }
): Promise<{
  encrypted_task: string;
  iv: string;
  checksum: string;
  key_version: number;
  schema_version: number;
}> {
  const jsonString = JSON.stringify(payload);
  const checksum = await computeChecksum(jsonString);
  
  // 12-byte cryptographically secure random IV
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const plaintextBuffer = textEncoder.encode(jsonString);

  // Authenticated Additional Data (AAD) prevents ciphertext substitution attacks
  const aadString = `${meta.taskId}:${meta.ownerId}:${meta.version}:v1`;
  const additionalData = textEncoder.encode(aadString);

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
      additionalData,
    },
    key,
    plaintextBuffer
  );

  return {
    encrypted_task: encodeBase64(encryptedBuffer),
    iv: encodeBase64(iv.buffer),
    checksum,
    key_version: 1,
    schema_version: 1,
  };
}

/**
 * Decrypts an encrypted task payload with optional AAD verification.
 */
export async function decryptTaskPayload(
  key: CryptoKey,
  ciphertextBase64: string,
  ivBase64: string,
  meta?: { taskId: string; ownerId: string; version: number }
): Promise<DecryptedTaskPayload> {
  const ivBuffer = decodeBase64(ivBase64);
  const ciphertextBuffer = decodeBase64(ciphertextBase64);

  let decryptedBuffer: ArrayBuffer;

  if (meta) {
    try {
      const aadString = `${meta.taskId}:${meta.ownerId}:${meta.version}:v1`;
      const additionalData = textEncoder.encode(aadString);

      decryptedBuffer = await window.crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: ivBuffer,
          additionalData,
        },
        key,
        ciphertextBuffer
      );
    } catch {
      // Fallback for non-AAD payloads or legacy test records
      decryptedBuffer = await window.crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: ivBuffer,
        },
        key,
        ciphertextBuffer
      );
    }
  } else {
    decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: ivBuffer,
      },
      key,
      ciphertextBuffer
    );
  }

  const jsonString = textDecoder.decode(decryptedBuffer);
  return JSON.parse(jsonString) as DecryptedTaskPayload;
}
