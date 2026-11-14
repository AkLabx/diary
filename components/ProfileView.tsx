import React, { useState, useEffect, ChangeEvent, useRef, useId } from 'react';
type Session = any;
import { Profile } from '../types';
import { useCrypto } from '../contexts/CryptoContext';
import { exportKey } from '../lib/crypto';
import { generateRecoveryKit } from '../lib/recoveryKit';
import { isBiometricSupported, registerBiometric } from '../lib/webauthn';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabaseClient';
import { Capacitor } from '@capacitor/core';
import { NativeBiometric } from '@capgo/capacitor-native-biometric';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../lib/cropUtils';

interface ProfileViewProps {
  session: Session;
  profile: Profile | null;
  onUpdateProfile: (updates: { full_name?: string }) => Promise<void>;
  onAvatarUpload: (file: File) => Promise<void>;
  onExportData: (onProgress: (progress: string) => void) => Promise<void>;
  onSignOut: () => void;
  onDeleteAccount?: () => Promise<void>;
  theme: string;
  onToggleTheme: () => void;
}

function useModalDialog(isOpen: boolean, isBusy: boolean, onDismiss: () => void) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closingProgrammaticallyRef = useRef(false);
  const pressedOutsideRef = useRef(false);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else if (dialog.open) {
      closingProgrammaticallyRef.current = true;
      dialog.close();
    }
  }, [isOpen]);

  const handleCancel = (e: React.SyntheticEvent<HTMLDialogElement>) => {
    if (isBusy) {
      e.preventDefault();
    }
  };

  const handleClose = () => {
    if (closingProgrammaticallyRef.current) {
      closingProgrammaticallyRef.current = false;
      return;
    }
    onDismiss();
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDialogElement>) => {
    const dialog = dialogRef.current;
    if (!dialog || e.target !== dialog) {
      pressedOutsideRef.current = false;
      return;
    }
    const rect = dialog.getBoundingClientRect();
    pressedOutsideRef.current =
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom;
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDialogElement>) => {
    const dialog = dialogRef.current;
    if (!dialog || !pressedOutsideRef.current || e.target !== dialog) {
      pressedOutsideRef.current = false;
      return;
    }
    pressedOutsideRef.current = false;
    if (isBusy || 'closedBy' in HTMLDialogElement.prototype) return;
    const rect = dialog.getBoundingClientRect();
    const isOutside =
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom;
    if (isOutside) {
      onDismiss();
    }
  };

  return {
    dialogRef,
    titleId,
    dialogProps: {
      onCancel: handleCancel,
      onClose: handleClose,
      onPointerDown: handlePointerDown,
      onPointerUp: handlePointerUp,
      ...({ closedby: isBusy ? 'none' : 'any' } as Record<string, string>),
    },
  };
}

const ProfileView: React.FC<ProfileViewProps> = ({
  session,
  profile,
  onUpdateProfile,
  onAvatarUpload,
  onExportData,
  onSignOut,
  onDeleteAccount,
  theme,
  onToggleTheme,
}) => {
  const [name, setName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSavingName, setIsSavingName] = useState(false);

  // Account Deletion State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Export State
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState('');

  // Recovery Kit Modal State
  const [isRecoveryModalOpen, setIsRecoveryModalOpen] = useState(false);
  const [recoveryPassword, setRecoveryPassword] = useState('');
  const [recoveryError, setRecoveryError] = useState<string | null>(null);
  const [isGeneratingKit, setIsGeneratingKit] = useState(false);
  
  // Biometric State
  const [isBioSupported, setIsBioSupported] = useState(false);
  const [isBioEnabled, setIsBioEnabled] = useState(false);
  const [isBioLoading, setIsBioLoading] = useState(false);
  
  // Avatar Display State
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null);

  // Cropping State
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const closeRecoveryModal = () => {
    setIsRecoveryModalOpen(false);
    setRecoveryPassword('');
    setRecoveryError(null);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setDeleteConfirmInput('');
    setDeleteError(null);
  };

  const cropDialog = useModalDialog(Boolean(cropImage), isUploading, () => handleCropCancel());
  const recoveryDialog = useModalDialog(isRecoveryModalOpen, isGeneratingKit, closeRecoveryModal);
  const deleteDialog = useModalDialog(isDeleteModalOpen, isDeletingAccount, closeDeleteModal);

  const { deriveAndVerifyKey, key } = useCrypto();
  const { addToast } = useToast();

  useEffect(() => {
    setName(profile?.full_name || '');
  }, [profile?.full_name]);

  useEffect(() => {
      const checkBio = async () => {
          const supported = await isBiometricSupported();
          setIsBioSupported(supported);
          const stored = localStorage.getItem(`diary_bio_${session.user.id}`);
          setIsBioEnabled(!!stored);
      };
      checkBio();
  }, [session.user.id]);
  
  useEffect(() => {
      let isMounted = true;
      const resolveAvatar = async () => {
          if (!profile?.avatar_url) {
              if (isMounted) setAvatarSrc(null);
              return;
          }
          
          // Legacy public URL support (e.g. Google Auth images)
          if (profile.avatar_url.startsWith('http')) {
              if (isMounted) setAvatarSrc(profile.avatar_url);
          } else {
              // Resolve private bucket path to signed URL
              try {
                  const { data, error } = await supabase.storage
                      .from('avatars')
                      .createSignedUrl(profile.avatar_url, 3600); // 1 hour
                  
                  if (error) throw error;

                  if (isMounted && data?.signedUrl) {
                      setAvatarSrc(data.signedUrl);
                  }
              } catch (e) {
                  console.error("Error resolving avatar URL. Check RLS policies.", e);
                  if (isMounted) setAvatarSrc(null);
              }
          }
      };
      resolveAvatar();
      return () => { isMounted = false; };
  }, [profile?.avatar_url]);

  const handleNameSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() !== profile?.full_name) {
      setIsSavingName(true);
      await onUpdateProfile({ full_name: name.trim() });
      setIsSavingName(false);
    }
    setIsEditingName(false);
  };

  // Step 1: Select File and set up for cropping
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const imageUrl = URL.createObjectURL(file);
      setCropImage(imageUrl);
      setZoom(1);
      setCrop({ x: 0, y: 0 });
      
      // Reset input so same file can be selected again if needed
      e.target.value = ''; 
    }
  };
  
  // FIX: Renamed unused parameter to '_' to resolve build error
  const onCropComplete = (_: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  // Step 2: Confirm Crop and Upload
  const handleCropSave = async () => {
    if (!cropImage || !croppedAreaPixels) return;

    try {
      setIsUploading(true);
      const croppedBlob = await getCroppedImg(cropImage, croppedAreaPixels);
      const croppedFile = new File([croppedBlob], 'avatar.jpg', { type: 'image/jpeg' });
      
      await onAvatarUpload(croppedFile);
      
      // Cleanup and Success Feedback
      setCropImage(null);
      addToast("Profile picture updated successfully", "success");
    } catch (e: any) {
      console.error(e);
      addToast(e.message || "Failed to update profile picture", "error");
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleCropCancel = () => {
      setCropImage(null);
      setIsUploading(false);
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
        const derivedKey = await deriveAndVerifyKey(recoveryPassword, session.user.id);
        
        if (!derivedKey) {
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
        const rawKey = await exportKey(derivedKey);

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

  const handleConfirmDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (deleteConfirmInput !== 'DELETE') {
      setDeleteError('Please type DELETE to confirm.');
      return;
    }
    if (!onDeleteAccount) return;
    setIsDeletingAccount(true);
    setDeleteError(null);
    try {
      await onDeleteAccount();
    } catch (err: any) {
      setDeleteError(err?.message || 'Failed to delete account. Please try again.');
      setIsDeletingAccount(false);
    }
  };
  
  const toggleBiometric = async () => {
      if (!key) {
          addToast("Encryption key not available. Please re-login.", "error");
          return;
      }
      
      setIsBioLoading(true);
      if (isBioEnabled) {
          // Disable
          localStorage.removeItem(`diary_bio_${session.user.id}`);

          if (Capacitor.isNativePlatform()) {
             try {
               await NativeBiometric.deleteData({ key: `diary_master_key_${session.user.id}` });
             } catch(err) {
               console.error("Failed to delete native biometric data", err);
             }
          }

          setIsBioEnabled(false);
          addToast("Biometric unlock disabled.", "info");
      } else {
          // Enable
          try {
              const data = await registerBiometric(key, session.user.id);
              localStorage.setItem(`diary_bio_${session.user.id}`, JSON.stringify(data));
              setIsBioEnabled(true);
              addToast("Biometric unlock enabled successfully!", "success");
          } catch (err: any) {
              console.error("Bio enable failed", err);
              addToast(err.message || "Failed to enable biometrics.", "error");
          }
      }
      setIsBioLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 animate-fade-in pb-24">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-8">Profile & Settings</h1>
        
        {/* Profile Card */}
        <div className="bg-white/50 dark:bg-slate-800/50 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="relative flex-shrink-0">
                    <div className="w-24 h-24 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex items-center justify-center">
                        {avatarSrc ? (
                            <img src={avatarSrc} alt="User avatar" className="w-full h-full object-cover" />
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-slate-500 dark:text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                        )}
                    </div>
                     <input 
                        ref={fileInputRef}
                        type="file" 
                        id="avatar-upload" 
                        className="hidden" 
                        onChange={handleFileChange} 
                        accept="image/*" 
                    />
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
                    <h3 id="dark-mode-switch-label" className="font-semibold text-slate-700 dark:text-slate-200">Dark Mode</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Toggle between light and dark themes.</p>
                </div>
                <button
                    type="button"
                    role="switch"
                    aria-checked={theme === 'dark'}
                    aria-labelledby="dark-mode-switch-label"
                    onClick={onToggleTheme}
                    className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${theme === 'dark' ? 'bg-indigo-500' : 'bg-slate-300'}`}
                >
                    <span aria-hidden="true" className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
            </div>

            {isBioSupported && (
                <div className="bg-white/50 dark:bg-slate-800/50 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <div>
                        <h3 id="biometric-switch-label" className="font-semibold text-slate-700 dark:text-slate-200">Biometric Unlock</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Use FaceID or TouchID to unlock your diary.</p>
                    </div>
                    <button 
                        type="button"
                        role="switch"
                        aria-checked={isBioEnabled}
                        aria-labelledby="biometric-switch-label"
                        onClick={toggleBiometric} 
                        disabled={isBioLoading}
                        className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${isBioEnabled ? 'bg-green-500' : 'bg-slate-300'}`}
                    >
                        <span aria-hidden="true" className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${isBioEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </div>
            )}

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

        {/* Danger Zone: Permanent Account Deletion */}
        {onDeleteAccount && (
          <div className="mt-12 pt-6 border-t border-red-200 dark:border-red-900/40">
            <h3 className="text-sm font-bold text-red-600 dark:text-red-400 mb-1 flex items-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Danger Zone
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Permanently delete your account, encrypted entries, and multimedia attachments. This action is completely irreversible.
            </p>
            <button
              type="button"
              onClick={() => {
                setDeleteConfirmInput('');
                setDeleteError(null);
                setIsDeleteModalOpen(true);
              }}
              className="px-4 py-2 font-semibold text-xs text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors shadow-sm"
            >
              Delete Account & All Data
            </button>
          </div>
        )}

        <div className="mt-8">
            <button
                onClick={onSignOut}
                className="w-full sm:w-auto px-6 py-2 font-semibold text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors text-sm"
            >
                Sign Out
            </button>
        </div>

        {/* App Info Footer */}
        <div className="mt-12 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 dark:text-slate-500 gap-2">
            <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-600 dark:text-slate-400">Diary</span>
                <span className="font-mono bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded text-[11px] text-slate-600 dark:text-slate-300">
                    v{import.meta.env.VITE_APP_VERSION || '1.0.8'}
                </span>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
                End-to-End Encrypted (AES-GCM)
            </p>
        </div>

        {/* CROPPER MODAL */}
        <dialog
            ref={cropDialog.dialogRef}
            aria-label="Crop avatar"
            {...cropDialog.dialogProps}
            className="m-auto w-[calc(100%-2rem)] max-w-lg bg-transparent p-0 border-0 text-inherit backdrop:bg-black/90"
        >
            {cropImage && (
            <div className="flex flex-col items-center justify-center w-full animate-fade-in">
                <div className="relative w-full h-[400px] bg-slate-800 rounded-lg overflow-hidden mb-4">
                    <Cropper
                        image={cropImage}
                        crop={crop}
                        zoom={zoom}
                        aspect={1}
                        onCropChange={setCrop}
                        onCropComplete={onCropComplete}
                        onZoomChange={setZoom}
                        cropShape="round"
                        showGrid={false}
                    />
                </div>
                
                {/* Zoom Control */}
                 <div className="w-full max-w-xs px-4 mb-6">
                    <label id="avatar-zoom-label" className="block text-xs text-slate-400 mb-1 text-center">Zoom</label>
                    <input
                        type="range"
                        value={zoom}
                        min={1}
                        max={3}
                        step={0.1}
                        aria-labelledby="avatar-zoom-label"
                        onChange={(e) => setZoom(Number(e.target.value))}
                        className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                </div>

                <div className="flex gap-4">
                    <button
                        type="button"
                        autoFocus
                        onClick={handleCropCancel}
                        disabled={isUploading}
                        className="px-6 py-2 text-sm font-semibold text-slate-300 bg-slate-700 hover:bg-slate-600 rounded-md"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleCropSave}
                        disabled={isUploading}
                        className="px-6 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md flex items-center gap-2"
                    >
                        {isUploading ? 'Saving...' : 'Save Avatar'}
                    </button>
                </div>
            </div>
            )}
        </dialog>
        
        {/* Password Confirmation Modal for Recovery Kit */}
        <dialog
            ref={recoveryDialog.dialogRef}
            aria-labelledby={recoveryDialog.titleId}
            {...recoveryDialog.dialogProps}
            className="m-auto w-[calc(100%-2rem)] max-w-md bg-transparent p-0 border-0 text-inherit backdrop:bg-black/50 backdrop:backdrop-blur-sm"
        >
            {isRecoveryModalOpen && (
                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-xl w-full border border-slate-200 dark:border-slate-700 animate-fade-in-down">
                    <h3 id={recoveryDialog.titleId} className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Verify Identity</h3>
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
                            autoComplete="current-password"
                        />
                        
                        {recoveryError && <p className="text-red-500 text-sm mb-4">{recoveryError}</p>}
                        
                        <div className="flex justify-end gap-3 mt-4">
                            <button 
                                type="button"
                                disabled={isGeneratingKit}
                                onClick={closeRecoveryModal}
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
            )}
        </dialog>

        {/* Account Deletion Confirmation Modal */}
        <dialog
          ref={deleteDialog.dialogRef}
          aria-labelledby={deleteDialog.titleId}
          {...deleteDialog.dialogProps}
          className="m-auto w-[calc(100%-2rem)] max-w-md bg-transparent p-0 border-0 text-inherit backdrop:bg-black/60 backdrop:backdrop-blur-sm"
        >
          {isDeleteModalOpen && (
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-2xl w-full border border-red-200 dark:border-red-900/60 animate-fade-in-down">
              <div className="flex items-center gap-3 text-red-600 dark:text-red-400 mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h3 id={deleteDialog.titleId} className="text-lg font-bold">Delete Account & All Data?</h3>
              </div>

              <div className="text-xs text-slate-600 dark:text-slate-300 space-y-2 mb-4 bg-red-50 dark:bg-red-950/30 p-3 rounded-lg border border-red-100 dark:border-red-900/30">
                <p className="font-semibold text-red-700 dark:text-red-300">
                  This action is permanent and completely irreversible!
                </p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Your user account will be permanently erased.</li>
                  <li>All encrypted diary entries will be purged from the database.</li>
                  <li>All uploaded images and voice notes will be destroyed.</li>
                  <li>Local cryptographic keys and biometrics will be wiped.</li>
                </ul>
              </div>

              <form onSubmit={handleConfirmDeleteAccount} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    To confirm, please type <span className="font-mono text-red-600 font-bold">DELETE</span> below:
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmInput}
                    onChange={(e) => setDeleteConfirmInput(e.target.value)}
                    placeholder="DELETE"
                    autoFocus
                    className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-slate-700 dark:text-slate-100"
                  />
                </div>

                {deleteError && (
                  <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                    {deleteError}
                  </p>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    disabled={isDeletingAccount}
                    onClick={closeDeleteModal}
                    className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-md dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={deleteConfirmInput !== 'DELETE' || isDeletingAccount}
                    className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-md disabled:bg-red-400 transition-colors"
                  >
                    {isDeletingAccount ? 'Erasing Everything...' : 'Permanently Delete Everything'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </dialog>
    </div>
  );
};

export default ProfileView;