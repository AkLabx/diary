import React, { useState, useEffect, ChangeEvent } from 'react';
import type { Session } from '@supabase/supabase-js';
import { Profile } from '../types';
import { useCrypto } from '../contexts/CryptoContext';
import { exportKey } from '../lib/crypto';
import { generateRecoveryKit } from '../lib/recoveryKit';

interface ProfileViewProps {
  session: Session;
  profile: Profile | null;
  onUpdateProfile: (updates: { full_name?: string }) => Promise<void>;
  onAvatarUpload: (file: File) => Promise<void>;
  onExportData: (onProgress: (progress: string) => void) => Promise<void>;
  onSignOut: () => void;
  theme: string;
  onToggleTheme: () => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({
  session,
  profile,
  onUpdateProfile,
  onAvatarUpload,
  onExportData,
  onSignOut,
  theme,
  onToggleTheme,
}) => {
  const [name, setName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSavingName, setIsSavingName] = useState(false);

  // Export State
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState('');

  // Recovery Kit Modal State
  const [isRecoveryModalOpen, setIsRecoveryModalOpen] = useState(false);
  const [recoveryPassword, setRecoveryPassword] = useState('');
  const [recoveryError, setRecoveryError] = useState<string | null>(null);
  const [isGeneratingKit, setIsGeneratingKit] = useState(false);
  
  const { deriveAndVerifyKey } = useCrypto();

  useEffect(() => {
    setName(profile?.full_name || '');
  }, [profile?.full_name]);

  const handleNameSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() !== profile?.full_name) {
      setIsSavingName(true);
      await onUpdateProfile({ full_name: name.trim() });
      setIsSavingName(false);
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

  const handleExportClick = async () => {
    setIsExporting(true);
    setExportProgress('Preparing...');
    try {
        await onExportData((progress) => setExportProgress(progress));
    } catch (error) {
        console.error("Export failed", error);
    } finally {
        setIsExporting(false);
        setExportProgress('');
    }
  };

  const handleGenerateRecoveryKit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError(null);
    setIsGeneratingKit(true);

    try {
        // 1. Verify Password
        const key = await deriveAndVerifyKey(recoveryPassword, session.user.id);
        
        if (!key) {
            setRecoveryError("Incorrect password.");
            setIsGeneratingKit(false);
            return;
        }

        if (!profile) {
            setRecoveryError("Profile data unavailable.");
            setIsGeneratingKit(false);
            return;
        }

        // 2. Export Raw Key
        const rawKey = await exportKey(key);

        // 3. Generate PDF
        generateRecoveryKit({
            email: session.user.email || 'Unknown',
            password: recoveryPassword,
            salt: profile.salt,
            rawKey: rawKey
        });

        // 4. Cleanup
        setRecoveryPassword('');
        setIsRecoveryModalOpen(false);

    } catch (error) {
        console.error("Error generating kit:", error);
        setRecoveryError("An error occurred. Please try again.");
    } finally {
        setIsGeneratingKit(false);
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 animate-fade-in">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-8">Profile & Settings</h1>
        
        {/* Profile Card */}
        <div className="bg-white/50 dark:bg-slate-800/50 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="relative flex-shrink-0">
                    <div className="w-24 h-24 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex items-center justify-center">
                        {profile?.avatar_url ? (
                            <img src={profile.avatar_url} alt="User avatar" className="w-full h-full object-cover" />
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-slate-500 dark:text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                        )}
                    </div>
                     <input type="file" id="avatar-upload" className="hidden" onChange={handleAvatarChange} accept="image/*" disabled={isUploading} />
                    <label htmlFor="avatar-upload" className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-600 rounded-full p-1.5 cursor-pointer shadow-md hover:bg-slate-100 dark:hover:bg-slate-500 transition-colors">
                        {isUploading ? (
                             <svg className="animate-spin h-5 w-5 text-slate-600 dark:text-slate-200" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-600 dark:text-slate-200" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                                <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                            </svg>
                        )}
                    </label>
                </div>
                <div className="flex-1 text-center sm:text-left">
                     {isEditingName ? (
                        <form onSubmit={handleNameSave} className="flex items-center gap-2">
                            <input 
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-3 py-2 text-xl font-bold border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:border-slate-600 disabled:opacity-75"
                            autoFocus
                            disabled={isSavingName}
                            />
                            <button type="submit" className="px-3 py-2 text-sm font-semibold text-white bg-indigo-500 rounded-md hover:bg-indigo-600 disabled:bg-indigo-400" disabled={isSavingName}>
                                {isSavingName ? 'Saving...' : 'Save'}
                            </button>
                        </form>
                    ) : (
                        <div className="flex items-center gap-3 justify-center sm:justify-start">
                            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">{profile?.full_name || 'Your Name'}</h2>
                            <button onClick={() => setIsEditingName(true)} className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 flex-shrink-0 text-slate-500">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                                    <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    )}
                    <p className="text-slate-500 dark:text-slate-400 mt-1">{session.user.email}</p>
                </div>
            </div>
        </div>

        {/* Settings List */}
        <div className="mt-8 space-y-4">
            <div className="bg-white/50 dark:bg-slate-800/50 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                    <h3 className="font-semibold text-slate-700 dark:text-slate-200">Dark Mode</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Toggle between light and dark themes.</p>
                </div>
                <button onClick={onToggleTheme} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${theme === 'dark' ? 'bg-indigo-500' : 'bg-slate-300'}`}>
                    <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
            </div>

            <div className="bg-white/50 dark:bg-slate-800/50 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                    <h3 className="font-semibold text-slate-700 dark:text-slate-200">Export Data (ZIP)</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Download entries as monthly JSON files.</p>
                </div>
                <button 
                    onClick={handleExportClick} 
                    disabled={isExporting}
                    className="px-4 py-2 text-sm font-semibold bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 min-w-[100px] justify-center"
                >
                    {isExporting ? (
                        <>
                           <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                           <span>{exportProgress}</span>
                        </>
                    ) : 'Export'}
                </button>
            </div>
            
             <div className="bg-white/50 dark:bg-slate-800/50 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                    <h3 className="font-semibold text-slate-700 dark:text-slate-200">Recovery Kit</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Download a backup of your encryption keys.</p>
                </div>
                <button 
                    onClick={() => setIsRecoveryModalOpen(true)}
                    className="px-4 py-2 text-sm font-semibold bg-yellow-100 text-yellow-800 rounded-md hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-200 dark:hover:bg-yellow-900/50 flex items-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    Backup Keys
                </button>
            </div>
        </div>

        <div className="mt-12">
            <button
                onClick={onSignOut}
                className="w-full sm:w-auto px-6 py-2 font-semibold text-red-600 bg-red-100 rounded-md hover:bg-red-200 dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900/80 transition-colors"
            >
                Sign Out
            </button>
        </div>
        
        {/* Password Confirmation Modal for Recovery Kit */}
        {isRecoveryModalOpen && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-xl w-full max-w-md border border-slate-200 dark:border-slate-700 animate-fade-in-down">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Verify Identity</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                        Please enter your master password to authenticate and generate your Recovery Kit. This will contain your raw encryption keys.
                    </p>
                    
                    <form onSubmit={handleGenerateRecoveryKit}>
                        <input 
                            type="password" 
                            placeholder="Your Password" 
                            value={recoveryPassword}
                            onChange={(e) => setRecoveryPassword(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 mb-2"
                            autoFocus
                        />
                        
                        {recoveryError && <p className="text-red-500 text-sm mb-4">{recoveryError}</p>}
                        
                        <div className="flex justify-end gap-3 mt-4">
                            <button 
                                type="button"
                                onClick={() => {
                                    setIsRecoveryModalOpen(false);
                                    setRecoveryPassword('');
                                    setRecoveryError(null);
                                }}
                                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-md dark:text-slate-300 dark:hover:bg-slate-700"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit"
                                disabled={isGeneratingKit || !recoveryPassword}
                                className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:bg-indigo-400"
                            >
                                {isGeneratingKit ? 'Generating...' : 'Download Kit'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
};

export default ProfileView;