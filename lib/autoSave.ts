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

export async function saveDraft(id: string, encryptedData: Blob, iv: string, userId?: string): Promise<void> {
  const db = await openDB();
  const draftId = userId ? `${userId}_${id}` : id;
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const draft: EncryptedDraft = {
      id: draftId,
      encryptedData,
      iv,
      timestamp: Date.now(),
    };
    const request = store.put(draft);

    request.onsuccess = () => resolve();
    request.onerror = () => reject('Save draft failed');
  });
}

export async function getDraft(id: string, userId?: string): Promise<EncryptedDraft | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const scopedId = userId ? `${userId}_${id}` : id;
    const request = store.get(scopedId);

    request.onsuccess = () => {
      if (request.result) {
        resolve(request.result);
      } else if (userId) {
        // Fallback for legacy unscoped drafts
        const legacyReq = store.get(id);
        legacyReq.onsuccess = () => resolve(legacyReq.result);
        legacyReq.onerror = () => reject('Get legacy draft failed');
      } else {
        resolve(undefined);
      }
    };
    request.onerror = () => reject('Get draft failed');
  });
}

export async function deleteDraft(id: string, userId?: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const scopedId = userId ? `${userId}_${id}` : id;
    const request = store.delete(scopedId);

    request.onsuccess = () => {
      // Also delete legacy unscoped draft if userId was provided
      if (userId) {
        store.delete(id);
      }
      resolve();
    };
    request.onerror = () => reject('Delete draft failed');
  });
}

export async function clearAllDrafts(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject('Clear drafts failed');
  });
}
