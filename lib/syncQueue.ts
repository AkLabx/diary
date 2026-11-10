// lib/syncQueue.ts
import { SupabaseClient } from '@supabase/supabase-js';

const DB_NAME = 'diary_sync_db';
const DB_VERSION = 1;
const OUTBOX_STORE = 'sync_outbox';
const DEAD_LETTER_STORE = 'dead_letter_queue';
const MAX_RETRY_COUNT = 5;

export interface OutboxItem {
  id: string; // unique UUID of the outbox job
  entryId: string; // entry ID affected
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  payload: any; // payload to send to Supabase (encrypted_entry, iv, etc.)
  timestamp: number;
  retryCount: number;
  lastError?: string;
}

let isProcessing = false;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB is not available'));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      reject(new Error('IndexedDB sync error: ' + (event.target as IDBOpenDBRequest).error));
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(OUTBOX_STORE)) {
        const outboxStore = db.createObjectStore(OUTBOX_STORE, { keyPath: 'id' });
        outboxStore.createIndex('timestamp', 'timestamp', { unique: false });
        outboxStore.createIndex('entryId', 'entryId', { unique: false });
      }
      if (!db.objectStoreNames.contains(DEAD_LETTER_STORE)) {
        const deadLetterStore = db.createObjectStore(DEAD_LETTER_STORE, { keyPath: 'id' });
        deadLetterStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

/**
 * Enqueue a mutation to the persistent offline outbox.
 * Intelligently deduplicates operations for the same entry:
 * - If UPDATE arrives for an unsynced INSERT, merges into that INSERT.
 * - If DELETE arrives for an unsynced INSERT, cancels and deletes both from outbox.
 */
export async function enqueueMutation(item: OutboxItem): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction([OUTBOX_STORE], 'readwrite');
    const store = tx.objectStore(OUTBOX_STORE);
    const entryIndex = store.index('entryId');
    const request = entryIndex.getAll(item.entryId);

    request.onsuccess = () => {
      const existingItems: OutboxItem[] = request.result || [];

      // Check if there is an unsynced INSERT for this entry
      const pendingInsert = existingItems.find(i => i.operation === 'INSERT');

      if (pendingInsert) {
        if (item.operation === 'DELETE') {
          // Entry was created offline and deleted before syncing; simply delete the pending INSERT
          store.delete(pendingInsert.id);
          tx.oncomplete = () => resolve();
          return;
        }

        if (item.operation === 'UPDATE') {
          // Merge payload into pending INSERT
          const updatedInsert: OutboxItem = {
            ...pendingInsert,
            payload: { ...pendingInsert.payload, ...item.payload },
            timestamp: Date.now()
          };
          store.put(updatedInsert);
          tx.oncomplete = () => resolve();
          return;
        }
      }

      // Check if there is an unsynced UPDATE for this entry
      const pendingUpdate = existingItems.find(i => i.operation === 'UPDATE');
      if (pendingUpdate && item.operation === 'UPDATE') {
        const mergedUpdate: OutboxItem = {
          ...pendingUpdate,
          payload: { ...pendingUpdate.payload, ...item.payload },
          timestamp: Date.now()
        };
        store.put(mergedUpdate);
        tx.oncomplete = () => resolve();
        return;
      }

      // Default: insert new outbox item
      store.put(item);
      tx.oncomplete = () => resolve();
    };

    request.onerror = () => reject(new Error('Failed to query outbox store'));
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Retrieve all pending mutations in ascending chronological order.
 */
export async function getPendingMutations(): Promise<OutboxItem[]> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction([OUTBOX_STORE], 'readonly');
    const store = tx.objectStore(OUTBOX_STORE);
    const index = store.index('timestamp');
    const request = index.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(new Error('Failed to fetch pending mutations'));
  });
}

/**
 * Remove an item from the outbox after successful sync.
 */
export async function removeMutation(id: string): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction([OUTBOX_STORE], 'readwrite');
    const store = tx.objectStore(OUTBOX_STORE);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error('Failed to remove mutation'));
  });
}

/**
 * Move a repeatedly failing mutation to the dead letter store so it doesn't block the queue.
 */
export async function moveToDeadLetter(item: OutboxItem, reason: string): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction([OUTBOX_STORE, DEAD_LETTER_STORE], 'readwrite');
    const outboxStore = tx.objectStore(OUTBOX_STORE);
    const deadLetterStore = tx.objectStore(DEAD_LETTER_STORE);

    outboxStore.delete(item.id);
    deadLetterStore.put({
      ...item,
      lastError: reason,
      failedAt: Date.now()
    });

    tx.oncomplete = () => {
      console.warn(`[SyncQueue] Item ${item.id} moved to dead-letter queue: ${reason}`);
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Process all pending outbox mutations against Supabase.
 * Concurrency-safe: skips execution if a sync pass is already active.
 */
export async function processOutbox(
  supabase: SupabaseClient,
  onSynced?: (item: OutboxItem, result: any) => void
): Promise<{ processed: number; failed: number }> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { processed: 0, failed: 0 };
  }

  if (isProcessing) {
    return { processed: 0, failed: 0 };
  }

  isProcessing = true;
  let processed = 0;
  let failed = 0;

  try {
    const mutations = await getPendingMutations();
    if (mutations.length === 0) {
      return { processed: 0, failed: 0 };
    }

    console.log(`[SyncQueue] Processing ${mutations.length} pending mutations...`);

    for (const item of mutations) {
      try {
        let resultData: any = null;

        if (item.operation === 'INSERT') {
          // Use upsert to be safe against partial previous submissions
          const { data, error } = await supabase
            .from('diaries')
            .upsert(item.payload, { onConflict: 'id' })
            .select('id, created_at, mood, tags, owner_id, journal')
            .single();

          if (error) throw error;
          resultData = data;
        } else if (item.operation === 'UPDATE') {
          const { data, error } = await supabase
            .from('diaries')
            .update(item.payload)
            .eq('id', item.entryId)
            .select('id, created_at, mood, tags, owner_id, journal')
            .single();

          if (error) throw error;
          resultData = data;
        } else if (item.operation === 'DELETE') {
          const { error } = await supabase
            .from('diaries')
            .delete()
            .eq('id', item.entryId);

          if (error) throw error;
        }

        // Successfully synchronized
        await removeMutation(item.id);
        processed++;
        if (onSynced) {
          onSynced(item, resultData);
        }
      } catch (err: any) {
        console.error(`[SyncQueue] Failed to sync mutation ${item.id}:`, err);
        failed++;

        const newRetryCount = (item.retryCount || 0) + 1;
        if (newRetryCount >= MAX_RETRY_COUNT) {
          await moveToDeadLetter(item, err?.message || 'Exceeded maximum retries');
        } else {
          // Update retry count and error message in outbox store
          const db = await openDB();
          await new Promise<void>((res, rej) => {
            const tx = db.transaction([OUTBOX_STORE], 'readwrite');
            const store = tx.objectStore(OUTBOX_STORE);
            store.put({
              ...item,
              retryCount: newRetryCount,
              lastError: err?.message || String(err)
            });
            tx.oncomplete = () => res();
            tx.onerror = () => rej(tx.error);
          });
        }
      }
    }
  } finally {
    isProcessing = false;
  }

  return { processed, failed };
}
