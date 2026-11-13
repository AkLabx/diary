import BottomNavigation from './components/BottomNavigation';
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Outlet, useNavigate, useLocation, useOutletContext } from 'react-router-dom';
import { supabase } from './lib/supabaseClient';
import { DiaryEntry, Profile, Weather, AudioMetadata } from './types';
import { useCrypto } from './contexts/CryptoContext';
import { useToast } from './contexts/ToastContext';
import { loadWeather, fetchWeatherByCity, fetchWeather, setCustomCity, getCoordinatesFromGPS } from './lib/weather';
import { generateSmartTags } from './lib/smartTags';
import { extractImagePaths, diffImagePaths } from './lib/cleanupUtils';
import { processImage } from './lib/imageUtils';
import { setIsAppSaving } from './lib/native/backButtonRegistry';

// @ts-ignore
import { ZipWriter, BlobWriter, TextReader, BlobReader } from '@zip.js/zip.js';

import LeftSidebar from './components/LeftSidebar';
import TopBar from './components/TopBar';
import InitializeEncryption from './components/InitializeEncryption';
import PasswordPrompt from './components/PasswordPrompt';
import SmartTagsModal from './components/SmartTagsModal';
import { enqueueMutation, processOutbox } from './lib/syncQueue';
import { getDraft, saveDraft } from './lib/autoSave';

import { Capacitor } from '@capacitor/core';
import { NativeBiometric } from '@capgo/capacitor-native-biometric';


type Session = any;

interface DiaryLayoutProps {
  session: Session;
  theme: string;
  onToggleTheme: () => void;
}

type KeyStatus = 'checking' | 'needed' | 'reauth' | 'ready';

// Context Interface for Child Routes
export interface DiaryContextType {
  entries: DiaryEntry[];
  profile: Profile | null;
  loading: boolean;
  weather: Weather | null;
  uniqueJournals: string[];
  refreshEntries: () => void;
  loadEntryContent: (id: string) => Promise<void>;
  saveEntry: (entryData: any) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  updateProfile: (updates: { full_name?: string }) => Promise<void>;
  uploadAvatar: (file: File) => Promise<void>;
  exportData: (onProgress: (msg: string) => void) => Promise<void>;
  theme: string;
  onToggleTheme: () => void;
  key: CryptoKey | null; // useful for direct encryption if needed
  encryptBinary: (key: CryptoKey, data: ArrayBuffer) => Promise<{ iv: string; data: ArrayBuffer }>;
  session: Session;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  registerSaveHandler: (handler: () => void) => void;
  isToolsPanelVisible: boolean;
  setToolsPanelVisible: (visible: boolean) => void;
}

// Helper for image placeholder
const SECURE_PLACEHOLDER = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
const yieldToMain = () => new Promise(resolve => setTimeout(resolve, 0));


const DiaryLayout: React.FC<DiaryLayoutProps> = ({ session, theme, onToggleTheme }) => {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const { key, setKey, encrypt, decrypt, encryptBinary, decryptBinary, lock } = useCrypto();
  const [keyStatus, setKeyStatus] = useState<KeyStatus>('checking');
  const [profile, setProfile] = useState<Profile | null>(null);

  const [isLeftSidebarVisible, setLeftSidebarVisible] = useState(() => window.innerWidth >= 768);
  const [isToolsPanelVisible, setToolsPanelVisible] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'synced' | 'encrypting' | 'error'>('synced');
  const [weather, setWeather] = useState<Weather | null>(null);
  const [isWeatherLoading, setIsWeatherLoading] = useState<boolean>(false);

  // Smart Tags State (Global to layout as it wraps the save process)
  const [isSmartTagsModalOpen, setIsSmartTagsModalOpen] = useState(false);
  const [pendingEntrySave, setPendingEntrySave] = useState<Partial<DiaryEntry> | null>(null);
  const [smartSuggestions, setSmartSuggestions] = useState<string[]>([]);

  const loadingEntriesRef = useRef<Set<string>>(new Set());
  const currentSaveHandler = useRef<(() => void) | null>(null);

  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const registerSaveHandler = useCallback((handler: () => void) => {
      currentSaveHandler.current = handler;
  }, []);

  const handleRefreshWeather = useCallback(async () => {
    setIsWeatherLoading(true);
    try {
      const weatherData = await loadWeather({ forceRefresh: true });
      setWeather(weatherData);
    } catch (error) {
      console.error("Failed to refresh weather:", error);
    } finally {
      setIsWeatherLoading(false);
    }
  }, []);

  const handleSetCustomCity = useCallback(async (cityName: string): Promise<boolean> => {
    setIsWeatherLoading(true);
    try {
      const weatherData = await fetchWeatherByCity(cityName);
      if (weatherData) {
        setCustomCity(cityName);
        setWeather(weatherData);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to set custom city:", error);
      return false;
    } finally {
      setIsWeatherLoading(false);
    }
  }, []);

  const handleUseGPSLocation = useCallback(async () => {
    setCustomCity(null);
    setIsWeatherLoading(true);
    try {
      const coords = await getCoordinatesFromGPS(8000);
      const weatherData = await fetchWeather(coords.lat, coords.lon, 'gps');
      if (weatherData) {
        setWeather(weatherData);
        setIsWeatherLoading(false);
        return;
      }
    } catch (error) {
      console.warn("GPS failed, trying fallback:", error);
    }
    const fallbackData = await loadWeather({ forceRefresh: true });
    setWeather(fallbackData);
    setIsWeatherLoading(false);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const initWeather = async () => {
      setIsWeatherLoading(true);
      try {
        const weatherData = await loadWeather();
        if (isMounted) {
          setWeather(weatherData);
        }
      } catch (error) {
        console.error("Weather init error:", error);
      } finally {
        if (isMounted) {
          setIsWeatherLoading(false);
        }
      }
    };
    initWeather();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    const checkKeyStatus = async () => {
      if (key) { setKeyStatus('ready'); return; }
      try {
        const { data } = await supabase.from('profiles').select('id').eq('id', session.user.id).maybeSingle();
        setKeyStatus(data ? 'reauth' : 'needed');
      } catch (error) {
        console.error("Error checking profile:", error);
        addToast("Error accessing profile. Please log out and in again.", "error");
        await (supabase.auth as any).signOut();
      }
    };
    checkKeyStatus();
  }, [key, session.user.id, addToast]);

  const handleKeyReady = (newKey: CryptoKey) => {
    setKey(newKey);
    setKeyStatus('ready');
  };

  // Auto-Lock Logic
  useEffect(() => {
      const checkLock = () => {
          const lastActive = localStorage.getItem('diary_last_active');
          if (lastActive) {
              const inactiveTime = Date.now() - parseInt(lastActive, 10);
              // Auto-lock after 1 minute (60000ms) like WhatsApp option, or immediately if you prefer
              // We'll use 60000ms as a reasonable default for now
              if (inactiveTime > 60000 && key) {
                  lock();
                  addToast("Diary locked for security.", "info");
              }
              localStorage.removeItem('diary_last_active');
          }
      };

      let cleanupNativeListener: (() => void) | null = null;
      let cleanupWebListener: (() => void) | null = null;

      if (Capacitor.isNativePlatform()) {
          import('./lib/native/appLifecycle').then(({ registerAppStateChangeListener }) => {
              registerAppStateChangeListener(
                  () => {
                      checkLock();
                  },
                  () => {
                      localStorage.setItem('diary_last_active', Date.now().toString());
                  }
              ).then((listener) => {
                  if (listener) {
                      cleanupNativeListener = () => { listener.remove(); };
                  }
              });
          });
      } else {
          const handleVisibilityChange = () => {
              if (document.visibilityState === 'hidden') {
                  localStorage.setItem('diary_last_active', Date.now().toString());
              } else if (document.visibilityState === 'visible') {
                  checkLock();
              }
          };

          document.addEventListener('visibilitychange', handleVisibilityChange);
          cleanupWebListener = () => document.removeEventListener('visibilitychange', handleVisibilityChange);
      }

      return () => {
          if (cleanupNativeListener) cleanupNativeListener();
          if (cleanupWebListener) cleanupWebListener();
      };
  }, [key, lock, addToast]);

  const fetchProfile = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
      if (error) throw error;
      setProfile(data as Profile);
    } catch (error) { console.error("Error fetching profile:", error); }
  }, [session.user.id]);

  const fetchEntries = useCallback(async () => {
    if (!key) return;
    setLoading(true);
    try {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        const cached = localStorage.getItem(`diary_meta_${session.user.id}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          setEntries(parsed);
          setLoading(false);
          return;
        }
      }

      const { data, error } = await supabase
        .from('diaries')
        .select('id, created_at, mood, tags, owner_id, journal')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const initialEntries: DiaryEntry[] = (data || []).map((entry) => ({
        id: entry.id,
        created_at: entry.created_at,
        mood: entry.mood,
        tags: entry.tags,
        owner_id: entry.owner_id,
        journal: entry.journal || 'Personal',
        title: '',
        content: '',
        isDecrypted: false,
        isLoading: false
      }));

      setEntries(initialEntries);
      try {
        localStorage.setItem(`diary_meta_${session.user.id}`, JSON.stringify(initialEntries));
      } catch (cacheErr) {}
    } catch (error) {
      console.error("Error fetching entries:", error);
      const cached = localStorage.getItem(`diary_meta_${session.user.id}`);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setEntries(parsed);
          setLoading(false);
          return;
        } catch (e) {}
      }
      addToast("Could not fetch entries.", "error");
    } finally { setLoading(false); }
  }, [key, addToast, session.user.id]);

  const loadEntryContent = useCallback(async (id: string) => {
    if (loadingEntriesRef.current.has(id) || !key) return;

    const entryIndex = entries.findIndex(e => e.id === id);
    if (entryIndex === -1) return;
    if (entries[entryIndex].isDecrypted) return;

    loadingEntriesRef.current.add(id);
    setEntries(prev => prev.map(e => e.id === id ? { ...e, isLoading: true } : e));

    try {
        let encryptedEntry = '';
        let entryIv = '';

        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          const cachedDraft = await getDraft(id);
          if (cachedDraft && cachedDraft.encryptedData) {
            encryptedEntry = await cachedDraft.encryptedData.text();
            entryIv = cachedDraft.iv;
          }
        }

        if (!encryptedEntry) {
          const { data, error } = await supabase
              .from('diaries')
              .select('encrypted_entry, iv')
              .eq('id', id)
              .single();

          if (error) throw error;
          encryptedEntry = data.encrypted_entry;
          entryIv = data.iv;

          try {
            const blob = new Blob([data.encrypted_entry], { type: 'text/plain' });
            await saveDraft(id, blob, data.iv);
          } catch (cacheErr) {}
        }

        const decrypted = await decrypt(key, encryptedEntry, entryIv);
        const parsed = JSON.parse(decrypted);
        const { title, content, audio } = parsed;

        setEntries(prev => prev.map(e => e.id === id ? {
            ...e,
            title,
            content,
            audio, // This might now be an array or single object (legacy)
            mood: parsed.mood !== undefined ? parsed.mood : e.mood,
            tags: parsed.tags !== undefined ? parsed.tags : e.tags,
            journal: parsed.journal !== undefined ? parsed.journal : e.journal,
            isDecrypted: true,
            isLoading: false
        } : e));

        // --- OPTION A: MIGRATION ON VIEW ---
        // Silently sync the decrypted media to the media_files table if it isn't already there.
        try {
            const imagePaths = extractImagePaths(content || '');
            let audioPaths = [];

            if (audio) {
                if (Array.isArray(audio)) {
                    audioPaths = audio.map(a => a.path);
                } else if (audio.path) { // Legacy single object
                    audioPaths = [audio.path];
                }
            }

            if (imagePaths.length > 0 || audioPaths.length > 0) {
                const mediaRecords = [
                    ...imagePaths.map(path => ({ user_id: session.user.id, entry_id: id, file_path: path, file_type: 'image' })),
                    ...audioPaths.map(path => ({ user_id: session.user.id, entry_id: id, file_path: path, file_type: 'audio' }))
                ];

                // Using ON CONFLICT entry_id, file_path DO NOTHING so we don't hammer the DB
                // if they are already migrated.
                await supabase.from('media_files').upsert(mediaRecords, { onConflict: 'entry_id,file_path' });
            }
        } catch (migrationErr) {
             console.error("Silent media migration failed on view:", migrationErr);
             // Ignore error to not break the view experience
        }
        // --- END MIGRATION ---


    } catch (error) {
        console.error(`Error decrypting entry ${id}:`, error);
        setEntries(prev => prev.map(e => e.id === id ? { ...e, isLoading: false } : e));
    } finally {
        loadingEntriesRef.current.delete(id);
    }
  }, [entries, key, decrypt, session.user.id]);


  useEffect(() => {
    if (keyStatus === 'ready') {
      fetchEntries();
      fetchProfile();
    }
  }, [fetchEntries, fetchProfile, keyStatus]);

  useEffect(() => {
    const handleOnline = async () => {
      console.log("[SyncQueue] Device reconnected; processing offline outbox...");
      try {
        const { processed, failed } = await processOutbox(supabase, (item, serverData) => {
          if (item.operation === 'INSERT' && serverData?.id) {
            setEntries(prev => prev.map(e => e.id === item.entryId ? { ...e, id: serverData.id } : e));
          }
        });
        if (processed > 0) {
          addToast(`Synced ${processed} offline change(s).`, "success");
          fetchEntries();
        }
        if (failed > 0) {
          console.warn(`[SyncQueue] ${failed} mutation(s) could not sync yet.`);
        }
      } catch (err) {
        console.error("[SyncQueue] Error syncing offline outbox on reconnect:", err);
      }
    };

    window.addEventListener('online', handleOnline);

    if (typeof navigator !== 'undefined' && navigator.onLine && session?.user?.id) {
      processOutbox(supabase, (item, serverData) => {
        if (item.operation === 'INSERT' && serverData?.id) {
          setEntries(prev => prev.map(e => e.id === item.entryId ? { ...e, id: serverData.id } : e));
        }
      }).then(({ processed }) => {
        if (processed > 0) {
          addToast(`Synced ${processed} pending change(s).`, "success");
          fetchEntries();
        }
      }).catch(err => console.error("[SyncQueue] Initial outbox sync pass error:", err));
    }

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [supabase, session?.user?.id, fetchEntries, addToast]);

  const uniqueJournals = useMemo(() => {
      const journals = new Set<string>();
      entries.forEach(e => {
          if (e.journal) journals.add(e.journal);
          else journals.add('Personal');
      });
      return Array.from(journals).sort();
  }, [entries]);


  // Clean content logic
  const cleanContentBeforeSave = (htmlContent: string) => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, 'text/html');
      const images = doc.querySelectorAll('img.secure-diary-image');
      images.forEach(img => {
          if (img.getAttribute('src')?.startsWith('blob:')) {
              img.setAttribute('src', SECURE_PLACEHOLDER);
          }
      });
      return doc.body.innerHTML;
  };

  // Internal save function
  const executeSave = useCallback(async (entryData: Partial<DiaryEntry> & Pick<DiaryEntry, 'title' | 'content' | 'created_at'>) => {
     setIsAppSaving(true);
     const saveTimeout = setTimeout(() => setIsAppSaving(false), 10000); // 10s safety timeout
     if (!key) { addToast("Security session expired.", "error"); return; }

     setSaveStatus('encrypting');
     try {
       // --- MULTI-AUDIO HANDLING ---
       // 1. Get current state to compare with
       const existingEntry = entryData.id ? entries.find(e => e.id === entryData.id) : null;
       const currentAudioList: AudioMetadata[] = [];

       // Handle legacy single-object audio
       if (existingEntry && existingEntry.audio) {
           if (Array.isArray(existingEntry.audio)) {
               currentAudioList.push(...existingEntry.audio);
           } else {
               // @ts-ignore: Handle legacy format
               currentAudioList.push({ ...existingEntry.audio, id: 'legacy' });
           }
       }

       // 2. Determine what to keep from 'entryData.audio' (UI deletions propagate here)
       // If entryData.audio is provided, it represents the *desired* list of existing audios.
       // Any ID in currentAudioList but NOT in entryData.audio should be deleted from Storage.
       let finalAudioList: AudioMetadata[] = [];

       if (entryData.audio) {
           // Diffing: Find removed items
           const keptIds = new Set(entryData.audio.map(a => a.id));
           const removedItems = currentAudioList.filter(a => !keptIds.has(a.id));

           if (removedItems.length > 0) {
               console.log(`Deleting ${removedItems.length} orphaned audio files...`);
               const pathsToRemove = removedItems.map(a => a.path);
               const { error: removeError } = await supabase.storage.from('diary-audio').remove(pathsToRemove);
               if (removeError) console.error("Failed to cleanup audio files:", removeError);
           }
           finalAudioList = [...entryData.audio];
       } else {
           // If not provided in update, assume no change to existing list
           finalAudioList = [...currentAudioList];
       }

       // 3. Process New Recordings (tempAudioBlobs)
       if (entryData.tempAudioBlobs && entryData.tempAudioBlobs.length > 0) {
           for (const recording of entryData.tempAudioBlobs) {
                try {
                    const buffer = await recording.blob.arrayBuffer();
                    const { iv, data } = await encryptBinary(key, buffer);
                    const encryptedBlob = new Blob([data], { type: 'application/octet-stream' });
                    const fileName = `${session.user.id}/${Date.now()}-${recording.id}.bin`;

                    const { error: uploadError } = await supabase.storage.from('diary-audio').upload(fileName, encryptedBlob, { upsert: true });
                    if (uploadError) throw uploadError;

                    finalAudioList.push({
                        id: recording.id,
                        path: fileName,
                        iv: iv,
                        type: recording.blob.type
                    });
                } catch (err) {
                    console.error("Audio upload failed", err);
                    addToast("Failed to secure one or more audio notes.", "error");
                }
           }
       }
       // --- END MULTI-AUDIO ---

       // --- IMAGE CLEANUP ---
       // Check if images were deleted by comparing old content vs new content
       if (existingEntry && existingEntry.content) {
           const removedImagePaths = diffImagePaths(existingEntry.content, entryData.content);
           if (removedImagePaths.length > 0) {
               console.log(`Deleting ${removedImagePaths.length} removed images...`);
               const { error: imgRemoveError } = await supabase.storage.from('diary-images').remove(removedImagePaths);
               if (imgRemoveError) console.error("Failed to cleanup image files:", imgRemoveError);
           }
       }
       // --- END IMAGE CLEANUP ---


       const cleanContent = cleanContentBeforeSave(entryData.content);

       const contentToEncrypt = JSON.stringify({
           title: entryData.title,
           content: cleanContent,
           audio: finalAudioList, // Save as array
           mood: entryData.mood,
           tags: entryData.tags,
           journal: entryData.journal || 'Personal'
       });
       const { iv, data: encrypted_entry } = await encrypt(key, contentToEncrypt);

       const isUpdate = !!entryData.id;
       const record = {
         encrypted_entry, iv,
         mood: entryData.mood, tags: entryData.tags,
         journal: entryData.journal || 'Personal',
         created_at: entryData.created_at
       };

       // Cache locally in IndexedDB (zero unencrypted data: stores AES-GCM ciphertext)
       try {
         const cacheId = entryData.id || 'draft';
         const blob = new Blob([encrypted_entry], { type: 'text/plain' });
         saveDraft(cacheId, blob, iv);
       } catch (cacheErr) {}

       const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
       if (!isOnline) {
         const entryId = entryData.id || crypto.randomUUID();
         const offlineRecord = {
           ...record,
           id: entryId,
           owner_id: session.user.id
         };

         await enqueueMutation({
           id: crypto.randomUUID(),
           entryId,
           operation: isUpdate ? 'UPDATE' : 'INSERT',
           payload: offlineRecord,
           timestamp: Date.now(),
           retryCount: 0
         });

         // Also save in local encrypted draft store under entryId
         try {
           const blob = new Blob([encrypted_entry], { type: 'text/plain' });
           saveDraft(entryId, blob, iv);
         } catch (e) {}

         if (isUpdate) {
           setEntries(prev => {
             const updated = prev.map(e => e.id === entryId ? {
               ...e,
               ...entryData,
               audio: finalAudioList,
               tempAudioBlobs: [],
               isDecrypted: true
             } as DiaryEntry : e);
             try { localStorage.setItem(`diary_meta_${session.user.id}`, JSON.stringify(updated)); } catch (e) {}
             return updated;
           });
         } else {
           const newEntry: DiaryEntry = {
             ...offlineRecord,
             ...entryData,
             audio: finalAudioList,
             tempAudioBlobs: [],
             id: entryId,
             isDecrypted: true,
             isLoading: false
           } as DiaryEntry;
           setEntries(prev => {
             const updated = [newEntry, ...prev].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
             try { localStorage.setItem(`diary_meta_${session.user.id}`, JSON.stringify(updated)); } catch (e) {}
             return updated;
           });
         }

         setSaveStatus('synced');
         setIsSmartTagsModalOpen(false);
         setPendingEntrySave(null);
         clearTimeout(saveTimeout);
         setIsAppSaving(false);
         addToast("Saved offline. Will sync when reconnected.", "info");
         navigate(`/app/entry/${entryId}`);
         return;
       }

       let newEntryId: string | null = null;
       if (isUpdate) {
         const { error } = await supabase.from('diaries').update(record).eq('id', entryData.id);
         if (error) throw error;

         setEntries(prev => {
           const updated = prev.map(e => e.id === entryData.id ? {
               ...e,
               ...entryData,
               audio: finalAudioList,
               tempAudioBlobs: [], // Clear temps
               isDecrypted: true
           } as DiaryEntry : e);
           try { localStorage.setItem(`diary_meta_${session.user.id}`, JSON.stringify(updated)); } catch (e) {}
           return updated;
         });

         try {
           const blob = new Blob([encrypted_entry], { type: 'text/plain' });
           saveDraft(entryData.id!, blob, iv);
         } catch (e) {}

         addToast('Entry saved!', 'success');
         // Redirect to view mode
         navigate(`/app/entry/${entryData.id}`);

       } else {
         const { data, error } = await supabase.from('diaries').insert({ ...record, owner_id: session.user.id }).select('id, created_at, mood, tags, owner_id, journal').single();
         if (data) newEntryId = data.id;
         if (error) throw error;

         const newEntry: DiaryEntry = {
             ...data,
             ...entryData,
             audio: finalAudioList,
             tempAudioBlobs: [], // Clear temps
             id: data.id,
             isDecrypted: true,
             isLoading: false
         } as DiaryEntry;

         setEntries(prev => {
           const updated = [newEntry, ...prev].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
           try { localStorage.setItem(`diary_meta_${session.user.id}`, JSON.stringify(updated)); } catch (e) {}
           return updated;
         });

         try {
           const blob = new Blob([encrypted_entry], { type: 'text/plain' });
           saveDraft(data.id, blob, iv);
         } catch (e) {}

         addToast('Entry created!', 'success');
         navigate(`/app/entry/${data.id}`);
       }

       // --- MEDIA SYNC START ---
       // Now that the diary is saved, sync the media paths to the media_files table
       try {
           const entryIdToSync = isUpdate ? entryData.id : newEntryId;

           // 1. Get current desired media for this entry
           const imagePaths = extractImagePaths(entryData.content || '');
           const audioPaths = finalAudioList.map(a => a.path);

           const mediaRecords = [
               ...imagePaths.map(path => ({ user_id: session.user.id, entry_id: entryIdToSync, file_path: path, file_type: 'image' })),
               ...audioPaths.map(path => ({ user_id: session.user.id, entry_id: entryIdToSync, file_path: path, file_type: 'audio' }))
           ];

           // 2. Fetch existing media for this entry
           const { data: existingMedia } = await supabase
               .from('media_files')
               .select('id, file_path')
               .eq('entry_id', entryIdToSync);

           const existingPaths = new Set(existingMedia?.map(m => m.file_path) || []);
           const newPaths = new Set(mediaRecords.map(m => m.file_path));

           // 3. Delete removed media
           const pathsToDelete = Array.from(existingPaths).filter(path => !newPaths.has(path));
           if (pathsToDelete.length > 0) {
               await supabase.from('media_files').delete().eq('entry_id', entryIdToSync).in('file_path', pathsToDelete);
           }

           // 4. Insert new media (using ON CONFLICT to avoid duplicates safely)
           const recordsToInsert = mediaRecords.filter(m => !existingPaths.has(m.file_path));
           if (recordsToInsert.length > 0) {
               await supabase.from('media_files').upsert(recordsToInsert, { onConflict: 'entry_id,file_path' });
           }
       } catch (syncError) {
           console.error("Failed to sync media files:", syncError);
           // We don't throw here to avoid breaking the main save flow.
       }
       // --- MEDIA SYNC END ---


       setSaveStatus('synced');
       setIsSmartTagsModalOpen(false);
       setPendingEntrySave(null);
       clearTimeout(saveTimeout);
       setIsAppSaving(false);

     } catch (error: any) {
       console.error("Error saving entry:", error);
       const isNetworkErr = (typeof navigator !== 'undefined' && !navigator.onLine) ||
         error?.message?.includes('fetch') ||
         error?.message?.includes('network') ||
         error?.name === 'TypeError';

       if (isNetworkErr) {
         try {
           const entryId = entryData.id || crypto.randomUUID();
           const isUpdate = !!entryData.id;
           const cleanContent = cleanContentBeforeSave(entryData.content);
           const contentToEncrypt = JSON.stringify({
             title: entryData.title,
             content: cleanContent,
             audio: entryData.audio || [],
             mood: entryData.mood,
             tags: entryData.tags,
             journal: entryData.journal || 'Personal'
           });
           const { iv, data: encrypted_entry } = await encrypt(key, contentToEncrypt);
           const offlineRecord = {
             id: entryId,
             owner_id: session.user.id,
             encrypted_entry,
             iv,
             mood: entryData.mood,
             tags: entryData.tags,
             journal: entryData.journal || 'Personal',
             created_at: entryData.created_at
           };

           await enqueueMutation({
             id: crypto.randomUUID(),
             entryId,
             operation: isUpdate ? 'UPDATE' : 'INSERT',
             payload: offlineRecord,
             timestamp: Date.now(),
             retryCount: 0
           });

           try {
             const blob = new Blob([encrypted_entry], { type: 'text/plain' });
             saveDraft(entryId, blob, iv);
           } catch (e) {}

           addToast("Network interrupted. Saved offline and will sync.", "info");
           setSaveStatus('synced');
           setIsSmartTagsModalOpen(false);
           setPendingEntrySave(null);
           clearTimeout(saveTimeout);
           setIsAppSaving(false);
           navigate(`/app/entry/${entryId}`);
           return;
         } catch (fallbackErr) {
           console.error("Offline fallback save failed:", fallbackErr);
         }
       }

       addToast("Failed to save entry.", "error");
       setSaveStatus('error');
       clearTimeout(saveTimeout);
       setIsAppSaving(false);
     }
  }, [key, session.user.id, encrypt, encryptBinary, addToast, entries, navigate]);

  // Public save function called by Editor
  const handleInitiateSave = useCallback(async (entryData: any) => {
    const existingTags = entryData.tags || [];
    const suggestions = generateSmartTags(entryData.content);
    const newSuggestions = suggestions.filter(tag =>
        !existingTags.some((existingTag: string) => existingTag.toLowerCase() === tag.toLowerCase())
    );

    if (newSuggestions.length > 0) {
        setPendingEntrySave(entryData);
        setSmartSuggestions(newSuggestions);
        setIsSmartTagsModalOpen(true);
    } else {
        await executeSave(entryData);
    }
  }, [executeSave]);

  const handleConfirmSmartTags = (finalTags: string[]) => {
    if (pendingEntrySave) {
        const title = pendingEntrySave.title || '';
        const content = pendingEntrySave.content || '';
        const created_at = pendingEntrySave.created_at || new Date().toISOString();
        executeSave({ ...pendingEntrySave, title, content, created_at, tags: finalTags });
    }
  };

  const handleCancelSmartTags = () => {
     if (pendingEntrySave) {
         const title = pendingEntrySave.title || '';
         const content = pendingEntrySave.content || '';
         const created_at = pendingEntrySave.created_at || new Date().toISOString();
         executeSave({ ...pendingEntrySave, title, content, created_at });
     }
  };

  const handleDeleteEntry = async (id: string) => {
    try {
      const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
      if (!isOnline) {
        await enqueueMutation({
          id: crypto.randomUUID(),
          entryId: id,
          operation: 'DELETE',
          payload: { id },
          timestamp: Date.now(),
          retryCount: 0
        });
        setEntries(prev => {
          const updated = prev.filter(e => e.id !== id);
          try { localStorage.setItem(`diary_meta_${session.user.id}`, JSON.stringify(updated)); } catch (e) {}
          return updated;
        });
        addToast("Entry deleted offline. Will sync when reconnected.", "info");
        navigate('/app');
        return;
      }

      // Cleanup Audio Files first
      const entryToDelete = entries.find(e => e.id === id);

      // We can only cleanup images if the entry is decrypted and loaded locally.
      // If it's not decrypted, we can't parse the content to find images.
      // This is a trade-off for zero-knowledge encryption.
      // However, usually delete is called from Detail View (decrypted).
      if (entryToDelete) {
          if (entryToDelete.isDecrypted && entryToDelete.content) {
              const imagePaths = extractImagePaths(entryToDelete.content);
              if (imagePaths.length > 0) {
                  await supabase.storage.from('diary-images').remove(imagePaths);
                  console.log(`Cleaned up ${imagePaths.length} image files.`);
              }
          }

          if (entryToDelete.audio) {
              const audioList = Array.isArray(entryToDelete.audio)
                ? entryToDelete.audio
                : [entryToDelete.audio]; // legacy support

              if (audioList.length > 0) {
                  const paths = audioList.map((a: any) => a.path).filter(Boolean);
                  if (paths.length > 0) {
                       await supabase.storage.from('diary-audio').remove(paths);
                       console.log(`Cleaned up ${paths.length} audio files.`);
                  }
              }
          }
      }

      const { error } = await supabase.from('diaries').delete().eq('id', id);
      if (error) throw error;
      setEntries(prev => {
        const updated = prev.filter(e => e.id !== id);
        try { localStorage.setItem(`diary_meta_${session.user.id}`, JSON.stringify(updated)); } catch (e) {}
        return updated;
      });
      addToast('Entry deleted successfully.', 'success');
      navigate('/app');
    } catch (error: any) {
      console.error("Error deleting entry:", error);
      const isNetworkErr = (typeof navigator !== 'undefined' && !navigator.onLine) ||
        error?.message?.includes('fetch') ||
        error?.message?.includes('network') ||
        error?.name === 'TypeError';

      if (isNetworkErr) {
        try {
          await enqueueMutation({
            id: crypto.randomUUID(),
            entryId: id,
            operation: 'DELETE',
            payload: { id },
            timestamp: Date.now(),
            retryCount: 0
          });
          setEntries(prev => {
            const updated = prev.filter(e => e.id !== id);
            try { localStorage.setItem(`diary_meta_${session.user.id}`, JSON.stringify(updated)); } catch (e) {}
            return updated;
          });
          addToast("Network interrupted. Entry deleted offline and will sync.", "info");
          navigate('/app');
          return;
        } catch (e) {}
      }
      addToast("Failed to delete entry.", "error");
    }
  };

  const handleUpdateProfile = async (updates: { full_name?: string }) => {
    try {
      const { data, error } = await supabase.from('profiles').update(updates).eq('id', session.user.id).select().single();
      if (error) throw error;
      setProfile(data as Profile);
      addToast("Profile updated successfully!", "success");
    } catch (error) {
      addToast("Failed to update profile.", "error");
      console.error("Error updating profile:", error);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    try {
      const { blob } = await processImage(file, 256, 0.85);
      const fileName = `${session.user.id}/${Date.now()}.webp`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, blob, {
        contentType: 'image/webp',
        upsert: true
      });
      if (uploadError) throw uploadError;
      const { error: updateError } = await supabase.from('profiles').update({ avatar_url: fileName }).eq('id', session.user.id);
      if (updateError) throw updateError;
      setProfile(prev => prev ? { ...prev, avatar_url: fileName } : null);
    } catch (error) {
      console.error("Error uploading avatar:", error);
      throw error;
    }
  };

  const handleExportData = async (onProgress: (progress: string) => void) => {
      if (!key) return;
      try {
        const { count, error: countError } = await supabase.from('diaries').select('*', { count: 'exact', head: true });
        if (countError) throw countError;
        const totalEntries = count || 0;
        if (totalEntries === 0) { addToast("No entries to export.", "info"); return; }
        const blobWriter = new BlobWriter("application/zip");
        const zipWriter = new ZipWriter(blobWriter);
        const BATCH_SIZE = 50;
        let processedCount = 0;
        let currentMonthBuffer: any[] = [];
        let currentMonthKey = "";
        const exportedMediaPaths = new Set<string>();

        for (let i = 0; i < totalEntries; i += BATCH_SIZE) {
            onProgress(`Exporting entries (${processedCount} / ${totalEntries})...`);
            await yieldToMain();
            const { data: batch, error } = await supabase.from('diaries').select('*').order('created_at', { ascending: false }).range(i, i + BATCH_SIZE - 1);
            if (error) throw error;
            if (!batch) continue;

            for (const entry of batch) {
                try {
                    const decryptedString = await decrypt(key, entry.encrypted_entry, entry.iv);
                    const content = JSON.parse(decryptedString);
                    const entryDate = new Date(entry.created_at);
                    const monthKey = `${entryDate.getFullYear()}-${String(entryDate.getMonth() + 1).padStart(2, '0')}`;
                    if (currentMonthKey && monthKey !== currentMonthKey && currentMonthBuffer.length > 0) {
                        await zipWriter.add(`${currentMonthKey}.json`, new TextReader(JSON.stringify(currentMonthBuffer, null, 2)));
                        currentMonthBuffer = [];
                        await yieldToMain();
                    }
                    currentMonthKey = monthKey;

                    // Multimedia Export: Audio notes
                    const exportedAudios: string[] = [];
                    if (content.audio) {
                      const audioList = Array.isArray(content.audio) ? content.audio : [content.audio];
                      for (const audioItem of audioList) {
                        if (audioItem.path && !exportedMediaPaths.has(audioItem.path)) {
                          try {
                            const { data: signed } = await supabase.storage.from('diary-audio').createSignedUrl(audioItem.path, 120);
                            if (signed?.signedUrl) {
                              const res = await fetch(signed.signedUrl);
                              if (res.ok) {
                                const encBuffer = await res.arrayBuffer();
                                const decBuffer = await decryptBinary(key, encBuffer, audioItem.iv);
                                const safeName = audioItem.path.split('/').pop()?.replace('.bin', '.webm') || `audio_${Date.now()}.webm`;
                                const zipPath = `attachments/audio/${safeName}`;
                                await zipWriter.add(zipPath, new BlobReader(new Blob([decBuffer], { type: 'audio/webm' })));
                                exportedMediaPaths.add(audioItem.path);
                                exportedAudios.push(zipPath);
                              }
                            }
                          } catch (mediaErr) {
                            console.warn("Could not export audio attachment:", mediaErr);
                          }
                        }
                      }
                    }

                    // Multimedia Export: Images
                    const exportedImages: string[] = [];
                    const imgPaths = extractImagePaths(content.content || '');
                    if (imgPaths.length > 0) {
                      const { data: signedUrls } = await supabase.storage.from('diary-images').createSignedUrls(imgPaths, 120);
                      if (signedUrls) {
                        for (const item of signedUrls) {
                          if (item.path && item.signedUrl && !exportedMediaPaths.has(item.path)) {
                            try {
                              const ivMatch = content.content?.match(new RegExp(`data-secure-metadata=["']([^"']*${item.path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^"']*)["']`));
                              let iv = '';
                              if (ivMatch) {
                                try {
                                  const meta = JSON.parse(ivMatch[1].replace(/&quot;/g, '"'));
                                  iv = meta.iv;
                                } catch (e) {}
                              }

                              const res = await fetch(item.signedUrl);
                              if (res.ok) {
                                const encBuffer = await res.arrayBuffer();
                                let finalBlob: Blob;
                                if (iv) {
                                  const decBuffer = await decryptBinary(key, encBuffer, iv);
                                  finalBlob = new Blob([decBuffer], { type: 'image/webp' });
                                } else {
                                  finalBlob = new Blob([encBuffer], { type: 'application/octet-stream' });
                                }
                                const safeName = item.path.split('/').pop()?.replace('.bin', '.webp') || `image_${Date.now()}.webp`;
                                const zipPath = `attachments/images/${safeName}`;
                                await zipWriter.add(zipPath, new BlobReader(finalBlob));
                                exportedMediaPaths.add(item.path);
                                exportedImages.push(zipPath);
                              }
                            } catch (imgErr) {
                              console.warn("Could not export image attachment:", imgErr);
                            }
                          }
                        }
                      }
                    }

                    currentMonthBuffer.push({
                        id: entry.id,
                        created_at: entry.created_at,
                        title: content.title,
                        content: content.content,
                        tags: content.tags !== undefined ? content.tags : entry.tags,
                        mood: content.mood !== undefined ? content.mood : entry.mood,
                        journal: content.journal !== undefined ? content.journal : entry.journal,
                        audio_attachments: exportedAudios.length > 0 ? exportedAudios : undefined,
                        image_attachments: exportedImages.length > 0 ? exportedImages : undefined
                    });
                } catch (err) { console.error(`Failed to export entry ${entry.id}`, err); }
                processedCount++;
            }
        }
        if (currentMonthBuffer.length > 0) {
            await zipWriter.add(`${currentMonthKey}.json`, new TextReader(JSON.stringify(currentMonthBuffer, null, 2)));
        }
        onProgress("Finalizing ZIP archive with all multimedia...");
        const blob = await zipWriter.close();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `diary_export_${new Date().toISOString().split('T')[0]}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        addToast("Export complete with all multimedia attachments!", "success");
      } catch (error) {
        console.error("Export failed:", error);
        addToast("Export failed.", "error");
      }
  };

  const handleSignOut = async () => {
    if (session?.user?.id) {
      if (Capacitor.isNativePlatform()) {
        try {
          await NativeBiometric.deleteData({ key: `diary_master_key_${session.user.id}` });
        } catch (e) {
          console.warn('Failed to clear native biometric during sign out', e);
        }
      }
      localStorage.removeItem(`diary_bio_${session.user.id}`);
    }
    await supabase.auth.signOut();
    navigate('/');
  };

  const handleDeleteAccount = useCallback(async () => {
    try {
      setIsAppSaving(true);
      addToast("Initiating complete account & data deletion...", "info");

      const { error } = await supabase.functions.invoke('delete-account', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to delete account on server');
      }

      if (Capacitor.isNativePlatform()) {
        try {
          await NativeBiometric.deleteData({ key: `diary_master_key_${session.user.id}` });
        } catch (e) {
          console.warn('Failed to clear native biometric', e);
        }
      }

      localStorage.removeItem(`diary_bio_${session.user.id}`);
      localStorage.removeItem(`diary_meta_${session.user.id}`);

      try {
        indexedDB.deleteDatabase('diary_sync_db');
        indexedDB.deleteDatabase('diary_drafts_db');
      } catch (idbErr) {}

      await supabase.auth.signOut();
      addToast("Your account and all encrypted data have been permanently deleted.", "success");
      navigate('/');
    } catch (err: any) {
      console.error("Account deletion failed:", err);
      addToast(err?.message || "Failed to delete account. Please try again or contact support.", "error");
      throw err;
    } finally {
      setIsAppSaving(false);
    }
  }, [session, addToast, navigate]);

  // Derived state for UI components
  // We need to map the current route to "activeView" string for LeftSidebar highlight
    const isEditing = location.pathname.includes('/edit') || location.pathname.includes('/new');
  let activeView = 'timeline';
  if (location.pathname.includes('/calendar')) activeView = 'calendar';
  else if (location.pathname.includes('/search')) activeView = 'search';
  else if (location.pathname.includes('/profile')) activeView = 'profile';

  // Note: 'journal' filter logic in sidebar needs to map to URL params if we want deep linking there.
  // For now, I'll keep 'activeJournal' state in Context? No, let's keep it simple.
  // The Sidebar expects 'activeJournal' prop. If we want journal filtering to be deep linked, we should have a route /app/journal/:name
  // But for this refactor, I might skip deep linking journal filters unless necessary,
  // OR I can use query params ?journal=Work
  const queryParams = new URLSearchParams(location.search);
  const activeJournal = queryParams.get('journal');

  const handleJournalSelect = (journal: string | null) => {
      if (journal) navigate(`/app?journal=${encodeURIComponent(journal)}`);
      else navigate('/app');
  };

  const handleViewChange = (view: string) => {
      if (view === 'timeline') navigate('/app');
      else navigate(`/app/${view}`);
  };


  // Prepare Context Value (Memoized to prevent full-tree cascading re-renders on clock ticks)
  const contextValue: DiaryContextType = useMemo(() => ({
      entries, profile, loading, weather, uniqueJournals,
      refreshEntries: fetchEntries, loadEntryContent, saveEntry: handleInitiateSave, deleteEntry: handleDeleteEntry,
      updateProfile: handleUpdateProfile, uploadAvatar: handleAvatarUpload, exportData: handleExportData,
      theme, onToggleTheme, key, encryptBinary, session, signOut: handleSignOut,
      deleteAccount: handleDeleteAccount,
      registerSaveHandler, isToolsPanelVisible, setToolsPanelVisible
  }), [
      entries, profile, loading, weather, uniqueJournals,
      fetchEntries, loadEntryContent, handleInitiateSave, handleDeleteEntry,
      handleUpdateProfile, handleAvatarUpload, handleExportData,
      theme, onToggleTheme, key, encryptBinary, session, handleSignOut,
      handleDeleteAccount,
      registerSaveHandler, isToolsPanelVisible
  ]);

  if (keyStatus !== 'ready') {
    let content;
    switch (keyStatus) {
        case 'checking': content = <p>Initializing Secure Session...</p>; break;
        case 'needed': content = <InitializeEncryption onSuccess={handleKeyReady} session={session} />; break;
        case 'reauth': content = <PasswordPrompt onSuccess={handleKeyReady} session={session} />; break;
        default: content = <p>An unexpected error occurred.</p>;
    }
    return <main className="flex items-center justify-center h-screen bg-[#FBF8F3] dark:bg-slate-900 text-slate-800 dark:text-slate-200">{content}</main>;
  }

  return (
    <div className="h-[100dvh] h-screen w-full max-w-full overflow-x-hidden flex flex-col font-sans bg-[#FBF8F3] dark:bg-slate-900">
       <TopBar
        isEditing={isEditing}
        onSave={() => {
            if (currentSaveHandler.current) {
                currentSaveHandler.current();
            } else {
                console.warn("No save handler registered");
            }
        }}
        onCancel={() => navigate(-1)}
        currentDate={new Date()} // Placeholder
        weather={weather}
        isWeatherLoading={isWeatherLoading}
        onRefreshWeather={handleRefreshWeather}
        onSetCustomCity={handleSetCustomCity}
        onUseGPSLocation={handleUseGPSLocation}
        theme={theme}
        onToggleTheme={onToggleTheme}
        saveStatus={saveStatus}
        profile={profile}
        onShowProfile={() => navigate('/app/profile')}
        isToolsPanelVisible={isToolsPanelVisible}
        onToggleToolsPanel={() => setToolsPanelVisible(prev => !prev)}
        isLeftSidebarVisible={isLeftSidebarVisible}
        onOpenSidebar={() => setLeftSidebarVisible(true)}
      />


      {isLeftSidebarVisible && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden" onClick={() => setLeftSidebarVisible(false)} aria-hidden="true" />
      )}

      <div className={`flex flex-1 overflow-hidden transition-all duration-300 ${isLeftSidebarVisible ? 'md:pl-64' : 'pl-0'} relative`}>
        <LeftSidebar
          isVisible={isLeftSidebarVisible}
          onClose={() => setLeftSidebarVisible(false)}
          activeView={activeView}
          onChangeView={handleViewChange}
          onNewEntry={() => navigate('/app/new')}
          journals={uniqueJournals}
          activeJournal={activeJournal}
          onSelectJournal={handleJournalSelect}
        />

        <main className={`flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto overflow-x-hidden min-w-0 w-full relative ${!isEditing ? 'pb-28' : ''}`}>
            <Outlet context={contextValue} />
        </main>
      </div>

            <BottomNavigation isVisible={!isEditing} />

      <SmartTagsModal
        isOpen={isSmartTagsModalOpen}
        existingTags={pendingEntrySave?.tags || []}
        suggestedTags={smartSuggestions}
        onConfirm={handleConfirmSmartTags}
        onCancel={handleCancelSmartTags}
      />
    </div>
  );
};

export default DiaryLayout;

export function useDiary() {
    return useOutletContext<DiaryContextType>();
}
