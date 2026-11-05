export interface AudioMetadata {
  id: string; // Unique ID for keying/diffing
  path: string;
  iv: string;
  type: string;
}

export interface DiaryEntry {
  id: string; // Will be a UUID from Supabase
  title: string;
  content: string;
  owner_id: string;
  created_at: string;
  updated_at?: string;
  tags?: string[];
  mood?: string;
  journal?: string; // New field for Multiple Journals feature
  
  // Audio Metadata (Stored inside encrypted content)
  // Changed from single object to array
  audio?: AudioMetadata[];

  // Fields for lazy loading architecture
  isDecrypted?: boolean;
  isLoading?: boolean;
  
  // Temporary state for editing
  // Changed from single blob to array of objects
  tempAudioBlobs?: { id: string; blob: Blob }[];
}

export interface Profile {
  id: string;
  salt: string;
  key_check_value: string;
  key_check_iv: string;
  full_name?: string;
  avatar_url?: string;
}

export type ViewState = 'timeline' | 'calendar' | 'search' | 'profile';
  
export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface Weather {
  temp: number;
  description: string;
  icon: string;
  location: string;
  source?: 'gps' | 'ip' | 'manual' | 'cache';
  updatedAt?: number;
}

export interface BiometricData {
  credentialId: string;
  salt: string; // The salt used for the PRF input
  encryptedKey: string; // The Master Key encrypted with the PRF output
  iv: string; // IV for the Master Key encryption
}

export interface MediaFile {
  id: string;
  user_id: string;
  entry_id: string;
  file_path: string;
  file_type: 'image' | 'audio';
  created_at: string;
}


// --- Personal Task Management Types ---

export interface SubTaskItem {
  id: string;
  text: string;
  done: boolean;
}

export interface DecryptedTaskPayload {
  title: string;
  notes?: string;
  subtasks?: SubTaskItem[];
  tags?: string[];
  reminderTime?: string; // e.g. "17:30"
}

export interface PersonalTask {
  id: string;
  owner_id: string;
  entry_id?: string | null;
  recurrence_template_id?: string | null;
  
  // Cryptographic payload & verification
  encrypted_task: string;
  iv: string;
  checksum: string;
  key_version: number;
  schema_version: number;
  version: number;
  
  // Minimal queryable metadata
  is_completed: boolean;
  due_date?: string | null; // "YYYY-MM-DD"
  category_code: number; // 0=General, 1=Personal, 2=Health, 3=Family, 4=Career, 5=Finance
  energy_level: 1 | 2 | 3; // 1=Low, 2=Medium, 3=High
  importance_level: 1 | 2 | 3; // 1=Optional, 2=Important, 3=Essential
  
  // Lifecycle & soft deletes
  completed_at?: string | null;
  deleted_at?: string | null;
  created_at: string;
  updated_at: string;
  
  // Client-side decrypted state
  decrypted?: DecryptedTaskPayload;
  isDecrypted?: boolean;
  isLoading?: boolean;
}

export interface TaskTemplate {
  id: string;
  owner_id: string;
  encrypted_template: string;
  iv: string;
  checksum: string;
  key_version: number;
  schema_version: number;
  rrule: string;
  active_from: string;
  active_until?: string | null;
  deleted_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskHistory {
  id: string;
  task_id: string;
  owner_id: string;
  action: 'created' | 'edited' | 'completed' | 'reopened' | 'soft_deleted' | 'restored';
  encrypted_diff: string;
  iv: string;
  created_at: string;
}

export interface TaskAttachment {
  id: string;
  task_id: string;
  owner_id: string;
  file_path: string;
  file_type: string;
  encrypted_metadata: string;
  iv: string;
  created_at: string;
}
