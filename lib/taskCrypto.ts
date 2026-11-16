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
 * Binds ciphertext immutably to taskId and ownerId so completion or version bumps
 * do not break decryption.
 */
export async function encryptTaskPayload(
  key: CryptoKey,
  payload: DecryptedTaskPayload,
  meta: { taskId: string; ownerId: string; version?: number }
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

  // Authenticated Additional Data (AAD) permanently binds to taskId and ownerId
  const aadString = `${meta.taskId}:${meta.ownerId}:v1`;
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
 * Decrypts an encrypted task payload with AAD and integrity checksum verification.
 * Attempts immutable AAD `${taskId}:${ownerId}:v1`, followed by legacy versioned AAD formats,
 * and verifies that the decrypted plaintext matches the stored SHA-256 checksum.
 */
export async function decryptTaskPayload(
  key: CryptoKey,
  ciphertextBase64: string,
  ivBase64: string,
  meta?: { taskId: string; ownerId: string; version?: number },
  expectedChecksum?: string
): Promise<DecryptedTaskPayload> {
  const ivBuffer = decodeBase64(ivBase64);
  const ciphertextBuffer = decodeBase64(ciphertextBase64);

  let decryptedBuffer: ArrayBuffer | null = null;

  if (meta) {
    // 1. Try standard immutable AAD format: `${taskId}:${ownerId}:v1`
    try {
      const immutableAad = textEncoder.encode(`${meta.taskId}:${meta.ownerId}:v1`);
      decryptedBuffer = await window.crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: ivBuffer,
          additionalData: immutableAad,
        },
        key,
        ciphertextBuffer
      );
    } catch {
      // 2. Try legacy format with current version: `${taskId}:${ownerId}:${version}:v1`
      if (meta.version !== undefined) {
        try {
          const legacyAad = textEncoder.encode(`${meta.taskId}:${meta.ownerId}:${meta.version}:v1`);
          decryptedBuffer = await window.crypto.subtle.decrypt(
            {
              name: 'AES-GCM',
              iv: ivBuffer,
              additionalData: legacyAad,
            },
            key,
            ciphertextBuffer
          );
        } catch {
          // 3. Try legacy format with previous version (for tasks toggled before OCC fix)
          try {
            const prevVersion = Math.max(1, meta.version - 1);
            const legacyPrevAad = textEncoder.encode(`${meta.taskId}:${meta.ownerId}:${prevVersion}:v1`);
            decryptedBuffer = await window.crypto.subtle.decrypt(
              {
                name: 'AES-GCM',
                iv: ivBuffer,
                additionalData: legacyPrevAad,
              },
              key,
              ciphertextBuffer
            );
          } catch {
            decryptedBuffer = null;
          }
        }
      }
    }

    // 4. Last-resort fallback for non-AAD / unauthenticated test records
    if (!decryptedBuffer) {
      console.warn(`[taskCrypto] AAD decryption failed for task ${meta.taskId}; falling back to non-AAD decryption.`);
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

  // Checksum verification
  if (expectedChecksum) {
    const computed = await computeChecksum(jsonString);
    if (computed !== expectedChecksum) {
      throw new Error(`Task payload integrity check failed: checksum mismatch.`);
    }
  }

  return JSON.parse(jsonString) as DecryptedTaskPayload;
}
