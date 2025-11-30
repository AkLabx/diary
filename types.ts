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
}

export interface BiometricData {
  credentialId: string;
  salt: string; // The salt used for the PRF input
  encryptedKey: string; // The Master Key encrypted with the PRF output
  iv: string; // IV for the Master Key encryption
}
