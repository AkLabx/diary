export interface DiaryEntry {
  id: string; // Will be a UUID from Supabase
  title: string;
  content: string;
  owner_id: string;
  created_at: string;
  tags?: string[];
  mood?: string;
  journal?: string; // New field for Multiple Journals feature
  // Fields for lazy loading architecture
  isDecrypted?: boolean;
  isLoading?: boolean;
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