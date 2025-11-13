import React, { useState, useEffect, ChangeEvent } from 'react';
// Fix: Use 'import type' for Session to resolve potential module resolution issues with older Supabase versions.
import type { Session } from '@supabase/supabase-js';
import { Profile, DiaryEntry } from '../types';
import { useToast } from '../contexts/ToastContext';

interface ProfilePanelProps {
  session: Session;
  profile: Profile | null;
  entries: DiaryEntry[];
  onClose: () => void;
  onSignOut: () => void;
  onUpdateProfile: (updates: { full_name?: string }) => Promise<void>;
  onAvatarUpload: (file: File) => Promise<void>;
  onOpenExportModal: () => void;
  theme: string;
  onToggleTheme: () => void;
}

const ProfilePanel: React.FC<ProfilePanelProps> = ({
  session,
  profile,
  entries,
  onClose,
  onSignOut,
  onUpdateProfile,
  onAvatarUpload,
  onOpenExportModal,
  theme,
  onToggleTheme,
}) => {
  const [name, setName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    setName(profile?.full_name || '');
  }, [profile?.full_name]);

  const handleNameSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() !== profile?.full_name) {
      await onUpdateProfile({ full_name: name.trim() });
    }
    setIsEditingName(false);
  };
  
  const handleAvatarChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsUploading(true);
      await onAvatarUpload(e.target.files[0]);
      setIsUploading(false);
    }
  };
  
  const handleOpenExportModalClick = () => {
    if(entries.length === 0) {
      addToast("You have no entries to export.", "info");
      return;
    }
    onOpenExportModal();
  };

  return (
    <div className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 z-30 animate-fade-in-down">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex items-center justify-center">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="User avatar" className="w-full h-full object-cover" />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-500 dark:text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <input type="file" id="avatar-upload" className="hidden" onChange={handleAvatarChange} accept="image/*" disabled={isUploading} />
            <label htmlFor="avatar-upload" className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-600 rounded-full p-1 cursor-pointer shadow-md hover:bg-slate-100 dark:hover:bg-slate-500 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-600 dark:text-slate-200" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0l-1.5-1.5a.5.5 0 01.707-.707l1.5 1.5a1 1 0 001.414 0l3-3z" />
                <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5z" />
              </svg>
            </label>
          </div>
          <div className="flex-1 min-w-0">
            {isEditingName ? (
              <form onSubmit={handleNameSave}>
                <input 
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:bg-slate-700 dark:border-slate-600"
                  autoFocus
                  onBlur={handleNameSave}
                />
              </form>
            ) : (
              <div className="flex items-start gap-2">
                <p className="flex-1 font-semibold text-slate-800 dark:text-slate-200 break-words">{profile?.full_name || 'Your Name'}</p>
                <button onClick={() => setIsEditingName(true)} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-500" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0l-1.5-1.5a.5.5 0 01.707-.707l1.5 1.5a1 1 0 001.414 0l3-3z" />
                  </svg>
                </button>
              </div>
            )}
            <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{session.user.email}</p>
          </div>
        </div>
      </div>
      
      <div className="p-2 space-y-1">
        <button 
          onClick={handleOpenExportModalClick}
          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-left text-slate-700 dark:text-slate-300 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700/50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          Export Data
        </button>

        <div className="w-full flex items-center justify-between gap-3 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 rounded-md">
            <div className="flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
              Dark Mode
            </div>
            <button onClick={onToggleTheme} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${theme === 'dark' ? 'bg-indigo-500' : 'bg-slate-300'}`}>
              <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
        </div>
      </div>

      <div className="p-2 border-t border-slate-200 dark:border-slate-700">
        <button 
          onClick={() => { onSignOut(); onClose(); }} 
          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-left text-slate-700 dark:text-slate-300 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700/50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
          </svg>
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default ProfilePanel;