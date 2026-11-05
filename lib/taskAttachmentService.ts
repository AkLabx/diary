import { supabase } from './supabaseClient';
import { encryptBinary, decryptBinary, encrypt, decrypt } from './crypto';

export interface DecryptedAttachment {
  id: string;
  taskId: string;
  filePath: string;
  fileType: string;
  name: string;
  size: number;
  iv: string;
  createdAt: string;
}

export const taskAttachmentService = {
  /**
   * Encrypts and uploads an attachment file for a specific task.
   */
  async uploadAttachment(
    key: CryptoKey,
    userId: string,
    taskId: string,
    file: File
  ): Promise<DecryptedAttachment> {
    const buffer = await file.arrayBuffer();
    const { iv: binaryIv, data: encryptedData } = await encryptBinary(key, buffer);

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `${userId}/task_attachments/${taskId}_${Date.now()}_${safeName}.bin`;

    const encryptedBlob = new Blob([encryptedData], { type: 'application/octet-stream' });
    const { error: uploadError } = await supabase.storage
      .from('diary-images')
      .upload(storagePath, encryptedBlob, {
        contentType: 'application/octet-stream',
        upsert: false,
      });

    if (uploadError) {
      console.error('Failed to upload encrypted attachment:', uploadError);
      throw uploadError;
    }

    // Encrypt file metadata (original name, size, type)
    const metaString = JSON.stringify({
      name: file.name,
      size: file.size,
      type: file.type || 'application/octet-stream',
    });
    const { iv: metaIv, data: encryptedMeta } = await encrypt(key, metaString);
    const packedMetadata = `${metaIv}:${encryptedMeta}`;

    const { data: inserted, error: insertError } = await supabase
      .from('task_attachments')
      .insert({
        task_id: taskId,
        owner_id: userId,
        file_path: storagePath,
        file_type: file.type || 'application/octet-stream',
        encrypted_metadata: packedMetadata,
        iv: binaryIv, // Binary IV
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to record task attachment in database:', insertError);
      await supabase.storage.from('diary-images').remove([storagePath]);
      throw insertError;
    }

    return {
      id: inserted.id,
      taskId: inserted.task_id,
      filePath: inserted.file_path,
      fileType: inserted.file_type,
      name: file.name,
      size: file.size,
      iv: binaryIv,
      createdAt: inserted.created_at,
    };
  },

  /**
   * Fetches and decrypts metadata for all attachments belonging to a task.
   */
  async fetchAttachments(key: CryptoKey, taskId: string): Promise<DecryptedAttachment[]> {
    const { data, error } = await supabase
      .from('task_attachments')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Failed to query task attachments:', error);
      throw error;
    }

    if (!data || data.length === 0) return [];

    const decryptedList: DecryptedAttachment[] = [];

    for (const row of data) {
      try {
        let meta = { name: 'Attachment', size: 0, type: row.file_type };
        if (row.encrypted_metadata) {
          try {
            if (row.encrypted_metadata.includes(':')) {
              const colonIndex = row.encrypted_metadata.indexOf(':');
              const metaIv = row.encrypted_metadata.substring(0, colonIndex);
              const metaCipher = row.encrypted_metadata.substring(colonIndex + 1);
              const metaStr = await decrypt(key, metaCipher, metaIv);
              meta = JSON.parse(metaStr);
            } else {
              const metaStr = await decrypt(key, row.encrypted_metadata, row.iv);
              meta = JSON.parse(metaStr);
            }
          } catch {
            meta = { name: row.file_path.split('/').pop() || 'Attachment', size: 0, type: row.file_type };
          }
        }

        decryptedList.push({
          id: row.id,
          taskId: row.task_id,
          filePath: row.file_path,
          fileType: row.file_type,
          name: meta.name || 'Attachment',
          size: meta.size || 0,
          iv: row.iv,
          createdAt: row.created_at,
        });
      } catch (err) {
        console.warn('Failed to decrypt attachment record:', row.id, err);
      }
    }

    return decryptedList;
  },

  /**
   * Generates a signed URL, downloads the encrypted binary,
   * decrypts it client-side with AES-GCM, and returns an in-memory Object URL.
   */
  async getDecryptedBlobUrl(key: CryptoKey, filePath: string, iv: string, fileType: string): Promise<string> {
    const { data, error } = await supabase.storage
      .from('diary-images')
      .createSignedUrl(filePath, 3600);

    if (error || !data?.signedUrl) {
      console.error('Failed to generate signed URL for attachment:', error);
      throw error || new Error('No signed URL generated');
    }

    const response = await fetch(data.signedUrl);
    if (!response.ok) {
      throw new Error(`Failed to download attachment binary: ${response.statusText}`);
    }

    const encryptedBuffer = await response.arrayBuffer();
    const decryptedBuffer = await decryptBinary(key, encryptedBuffer, iv);
    const blob = new Blob([decryptedBuffer], { type: fileType });
    return URL.createObjectURL(blob);
  },

  /**
   * Deletes an attachment from private Supabase storage and database table.
   */
  async deleteAttachment(attachmentId: string, filePath: string): Promise<void> {
    const { error: dbError } = await supabase
      .from('task_attachments')
      .delete()
      .eq('id', attachmentId);

    if (dbError) {
      console.error('Failed to delete attachment from DB:', dbError);
      throw dbError;
    }

    const { error: storageError } = await supabase.storage
      .from('diary-images')
      .remove([filePath]);

    if (storageError) {
      console.warn('Failed to remove attachment file from storage bucket:', storageError);
    }
  },
};
