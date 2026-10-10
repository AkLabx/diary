// lib/autoSave.ts

const DB_NAME = 'diary_drafts_db';
const STORE_NAME = 'drafts';
const DB_VERSION = 1;

interface EncryptedDraft {
  id: string; // 'draft' for new entries, or UUID for existing
  encryptedData: Blob; // The encrypted binary blob
  iv: string; // Initialization vector for decryption
  timestamp: number; // For comparing freshness
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      reject('Database error: ' + (event.target as IDBOpenDBRequest).error);
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

export async function saveDraft(id: string, encryptedData: Blob, iv: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const draft: EncryptedDraft = {
      id,
      encryptedData,
      iv,
      timestamp: Date.now(),
    };
    const request = store.put(draft);

    request.onsuccess = () => resolve();
    request.onerror = () => reject('Save draft failed');
  });
}

export async function getDraft(id: string): Promise<EncryptedDraft | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject('Get draft failed');
  });
}

export async function deleteDraft(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject('Delete draft failed');
  });
}
