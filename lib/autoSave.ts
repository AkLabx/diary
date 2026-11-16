// lib/autoSave.ts

const DB_NAME = 'diary_drafts_db';
const DB_VERSION = 2;

const DRAFTS_STORE = 'editor_drafts';
const READ_CACHE_STORE = 'entry_read_cache';
const LEGACY_DRAFTS_STORE = 'drafts';

export interface EncryptedDraft {
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
      if (!db.objectStoreNames.contains(DRAFTS_STORE)) {
        db.createObjectStore(DRAFTS_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(READ_CACHE_STORE)) {
        db.createObjectStore(READ_CACHE_STORE, { keyPath: 'id' });
      }
    };
  });
}

// --- DRAFTS STORE (editor_drafts) ---

export async function saveDraft(id: string, encryptedData: Blob, iv: string, userId?: string): Promise<void> {
  const db = await openDB();
  const draftId = userId ? `${userId}_${id}` : id;
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([DRAFTS_STORE], 'readwrite');
    const store = transaction.objectStore(DRAFTS_STORE);
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
    const hasLegacy = db.objectStoreNames.contains(LEGACY_DRAFTS_STORE);
    const storeNames = hasLegacy ? [DRAFTS_STORE, LEGACY_DRAFTS_STORE] : [DRAFTS_STORE];
    const transaction = db.transaction(storeNames, 'readonly');
    const store = transaction.objectStore(DRAFTS_STORE);
    const scopedId = userId ? `${userId}_${id}` : id;
    const request = store.get(scopedId);

    request.onsuccess = () => {
      if (request.result) {
        resolve(request.result);
      } else if (userId) {
        // Fallback for unscoped draft in editor_drafts
        const unscopedReq = store.get(id);
        unscopedReq.onsuccess = () => {
          if (unscopedReq.result) {
            resolve(unscopedReq.result);
          } else if (hasLegacy) {
            // Fallback for legacy store 'drafts'
            const legacyStore = transaction.objectStore(LEGACY_DRAFTS_STORE);
            const legacyScopedReq = legacyStore.get(scopedId);
            legacyScopedReq.onsuccess = () => {
              if (legacyScopedReq.result) {
                resolve(legacyScopedReq.result);
              } else {
                const legacyReq = legacyStore.get(id);
                legacyReq.onsuccess = () => resolve(legacyReq.result);
                legacyReq.onerror = () => reject('Get legacy draft failed');
              }
            };
            legacyScopedReq.onerror = () => reject('Get legacy draft failed');
          } else {
            resolve(undefined);
          }
        };
        unscopedReq.onerror = () => reject('Get draft failed');
      } else if (hasLegacy) {
        const legacyStore = transaction.objectStore(LEGACY_DRAFTS_STORE);
        const legacyReq = legacyStore.get(id);
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
    const hasLegacy = db.objectStoreNames.contains(LEGACY_DRAFTS_STORE);
    const storeNames = hasLegacy ? [DRAFTS_STORE, LEGACY_DRAFTS_STORE] : [DRAFTS_STORE];
    const transaction = db.transaction(storeNames, 'readwrite');
    const store = transaction.objectStore(DRAFTS_STORE);
    const scopedId = userId ? `${userId}_${id}` : id;
    const request = store.delete(scopedId);

    request.onsuccess = () => {
      if (userId) {
        store.delete(id);
      }
      if (hasLegacy) {
        const legacyStore = transaction.objectStore(LEGACY_DRAFTS_STORE);
        legacyStore.delete(scopedId);
        if (userId) legacyStore.delete(id);
      }
      resolve();
    };
    request.onerror = () => reject('Delete draft failed');
  });
}

export async function clearAllDrafts(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const hasLegacy = db.objectStoreNames.contains(LEGACY_DRAFTS_STORE);
    const storeNames = hasLegacy ? [DRAFTS_STORE, LEGACY_DRAFTS_STORE] : [DRAFTS_STORE];
    const transaction = db.transaction(storeNames, 'readwrite');
    const store = transaction.objectStore(DRAFTS_STORE);
    const request = store.clear();

    request.onsuccess = () => {
      if (hasLegacy) {
        const legacyStore = transaction.objectStore(LEGACY_DRAFTS_STORE);
        legacyStore.clear();
      }
      resolve();
    };
    request.onerror = () => reject('Clear drafts failed');
  });
}

// --- READ CACHE STORE (entry_read_cache) ---

export async function saveReadCache(id: string, encryptedData: Blob, iv: string, userId?: string): Promise<void> {
  const db = await openDB();
  const cacheId = userId ? `${userId}_${id}` : id;
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([READ_CACHE_STORE], 'readwrite');
    const store = transaction.objectStore(READ_CACHE_STORE);
    const cacheEntry: EncryptedDraft = {
      id: cacheId,
      encryptedData,
      iv,
      timestamp: Date.now(),
    };
    const request = store.put(cacheEntry);

    request.onsuccess = () => resolve();
    request.onerror = () => reject('Save read cache failed');
  });
}

export async function getReadCache(id: string, userId?: string): Promise<EncryptedDraft | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([READ_CACHE_STORE], 'readonly');
    const store = transaction.objectStore(READ_CACHE_STORE);
    const scopedId = userId ? `${userId}_${id}` : id;
    const request = store.get(scopedId);

    request.onsuccess = () => {
      if (request.result) {
        resolve(request.result);
      } else if (userId) {
        const legacyReq = store.get(id);
        legacyReq.onsuccess = () => resolve(legacyReq.result);
        legacyReq.onerror = () => reject('Get legacy read cache failed');
      } else {
        resolve(undefined);
      }
    };
    request.onerror = () => reject('Get read cache failed');
  });
}

export async function deleteReadCache(id: string, userId?: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([READ_CACHE_STORE], 'readwrite');
    const store = transaction.objectStore(READ_CACHE_STORE);
    const scopedId = userId ? `${userId}_${id}` : id;
    const request = store.delete(scopedId);

    request.onsuccess = () => {
      if (userId) {
        store.delete(id);
      }
      resolve();
    };
    request.onerror = () => reject('Delete read cache failed');
  });
}

export async function clearAllReadCache(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([READ_CACHE_STORE], 'readwrite');
    const store = transaction.objectStore(READ_CACHE_STORE);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject('Clear read cache failed');
  });
}
