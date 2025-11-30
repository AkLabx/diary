import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Outlet, useNavigate, useLocation, useOutletContext } from 'react-router-dom';
import { supabase } from './lib/supabaseClient';
import { DiaryEntry, Profile, Weather } from './types';
import { useCrypto } from './contexts/CryptoContext';
import { useToast } from './contexts/ToastContext';
import { fetchWeather } from './lib/weather';
import { generateSmartTags } from './lib/smartTags';

// @ts-ignore
import { ZipWriter, BlobWriter, TextReader } from '@zip.js/zip.js';

import LeftSidebar from './components/LeftSidebar';
import TopBar from './components/TopBar';
import InitializeEncryption from './components/InitializeEncryption';
import PasswordPrompt from './components/PasswordPrompt';
import HamburgerMenu from './components/HamburgerMenu';
import SmartTagsModal from './components/SmartTagsModal';

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

  const { key, setKey, encrypt, decrypt, encryptBinary, lock } = useCrypto();
  const [keyStatus, setKeyStatus] = useState<KeyStatus>('checking');
  const [profile, setProfile] = useState<Profile | null>(null);

  const [isLeftSidebarVisible, setLeftSidebarVisible] = useState(() => window.innerWidth >= 768);
  const [isToolsPanelVisible, setToolsPanelVisible] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'synced' | 'encrypting' | 'error'>('synced');
  const [weather, setWeather] = useState<Weather | null>(null);

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

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const weatherData = await fetchWeather(position.coords.latitude, position.coords.longitude);
          setWeather(weatherData);
        } catch (error) {
          console.error("Failed to fetch weather:", error);
        }
      },
      (error) => {
        console.warn("Geolocation permission denied. Weather feature disabled.", error.message);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 1000 * 60 * 60 }
    );
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
      const handleVisibilityChange = () => {
          if (document.visibilityState === 'hidden') {
              localStorage.setItem('diary_last_active', Date.now().toString());
          } else if (document.visibilityState === 'visible') {
              const lastActive = localStorage.getItem('diary_last_active');
              if (lastActive) {
                  const inactiveTime = Date.now() - parseInt(lastActive, 10);
                  if (inactiveTime > 120000 && key) {
                      lock();
                      addToast("Diary locked for security.", "info");
                  }
                  localStorage.removeItem('diary_last_active');
              }
          }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
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
    } catch (error) {
      console.error("Error fetching entries:", error);
      addToast("Could not fetch entries.", "error");
    } finally { setLoading(false); }
  }, [key, addToast]);

  const loadEntryContent = useCallback(async (id: string) => {
    if (loadingEntriesRef.current.has(id) || !key) return;

    const entryIndex = entries.findIndex(e => e.id === id);
    if (entryIndex === -1) return;
    if (entries[entryIndex].isDecrypted) return;

    loadingEntriesRef.current.add(id);
    setEntries(prev => prev.map(e => e.id === id ? { ...e, isLoading: true } : e));

    try {
        const { data, error } = await supabase
            .from('diaries')
            .select('encrypted_entry, iv')
            .eq('id', id)
            .single();

        if (error) throw error;

        const decrypted = await decrypt(key, data.encrypted_entry, data.iv);
        const { title, content, audio } = JSON.parse(decrypted);

        setEntries(prev => prev.map(e => e.id === id ? {
            ...e,
            title,
            content,
            audio,
            isDecrypted: true,
            isLoading: false
        } : e));

    } catch (error) {
        console.error(`Error decrypting entry ${id}:`, error);
        setEntries(prev => prev.map(e => e.id === id ? { ...e, isLoading: false } : e));
    } finally {
        loadingEntriesRef.current.delete(id);
    }
  }, [entries, key, decrypt]);


  useEffect(() => {
    if (keyStatus === 'ready') {
      fetchEntries();
      fetchProfile();
    }
  }, [fetchEntries, fetchProfile, keyStatus]);

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
     if (!key) { addToast("Security session expired.", "error"); return; }

     setSaveStatus('encrypting');
     try {
       let audioMetadata = null;
       // Logic to get current audio metadata if we are editing an existing entry
       // This is a bit tricky since 'entryData' might not have it if it wasn't touched
       // But 'entries' state has the old data.
       const existingEntry = entryData.id ? entries.find(e => e.id === entryData.id) : null;
       const currentEntryState = existingEntry || {};

       if (entryData.tempAudioBlob) {
            try {
                const buffer = await entryData.tempAudioBlob.arrayBuffer();
                const { iv, data } = await encryptBinary(key, buffer);
                const encryptedBlob = new Blob([data], { type: 'application/octet-stream' });
                const fileName = `${session.user.id}/${Date.now()}-audio.bin`;
                const { error: uploadError } = await supabase.storage.from('diary-audio').upload(fileName, encryptedBlob, { upsert: true });
                if (uploadError) throw uploadError;
                audioMetadata = { path: fileName, iv: iv, type: entryData.tempAudioBlob.type };
            } catch (err) {
                console.error("Audio upload failed", err);
                addToast("Failed to secure audio. Saving text only.", "error");
            }
       } else if ('audio' in currentEntryState) {
           // @ts-ignore
           audioMetadata = currentEntryState.audio;
       }
       // If entryData explicitly has audio (e.g. cleared to null), respect it?
       // For now assuming entryData.audio isn't passed directly unless modifying it.
       if (entryData.audio !== undefined) audioMetadata = entryData.audio;


       const cleanContent = cleanContentBeforeSave(entryData.content);

       const contentToEncrypt = JSON.stringify({
           title: entryData.title,
           content: cleanContent,
           audio: audioMetadata
       });
       const { iv, data: encrypted_entry } = await encrypt(key, contentToEncrypt);

       const isUpdate = !!entryData.id;
       const record = {
         encrypted_entry, iv,
         mood: entryData.mood, tags: entryData.tags,
         journal: entryData.journal || 'Personal',
         created_at: entryData.created_at
       };

       if (isUpdate) {
         const { error } = await supabase.from('diaries').update(record).eq('id', entryData.id);
         if (error) throw error;

         setEntries(prev => prev.map(e => e.id === entryData.id ? {
             ...e,
             ...entryData,
             audio: audioMetadata,
             isDecrypted: true
         } as DiaryEntry : e));

         addToast('Entry saved!', 'success');
         // Redirect to view mode
         navigate(`/app/entry/${entryData.id}`);

       } else {
         const { data, error } = await supabase.from('diaries').insert({ ...record, owner_id: session.user.id }).select('id, created_at, mood, tags, owner_id, journal').single();
         if (error) throw error;

         const newEntry: DiaryEntry = {
             ...data,
             ...entryData,
             audio: audioMetadata,
             id: data.id,
             isDecrypted: true,
             isLoading: false
         } as DiaryEntry;

         setEntries(prev => [newEntry, ...prev].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
         addToast('Entry created!', 'success');
         navigate(`/app/entry/${data.id}`);
       }

       setSaveStatus('synced');
       setIsSmartTagsModalOpen(false);
       setPendingEntrySave(null);

     } catch (error) {
       console.error("Error saving entry:", error);
       addToast("Failed to save entry.", "error");
       setSaveStatus('error');
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
      const { error } = await supabase.from('diaries').delete().eq('id', id);
      if (error) throw error;
      setEntries(prev => prev.filter(e => e.id !== id));
      addToast('Entry deleted successfully.', 'success');
      navigate('/app');
    } catch (error) {
      console.error("Error deleting entry:", error);
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
      const fileExt = file.name.split('.').pop();
      const fileName = `${session.user.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file, { upsert: true });
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
      // Reuse the export logic from previous DiaryApp
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

        for (let i = 0; i < totalEntries; i += BATCH_SIZE) {
            onProgress(`Processing ${processedCount} / ${totalEntries}`);
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
                    currentMonthBuffer.push({
                        id: entry.id, created_at: entry.created_at, title: content.title, content: content.content, tags: entry.tags,
                        mood: entry.mood, journal: entry.journal, audio: content.audio ? "Audio file attached" : undefined
                    });
                } catch (err) { console.error(`Failed to export entry ${entry.id}`, err); }
                processedCount++;
            }
        }
        if (currentMonthBuffer.length > 0) {
            await zipWriter.add(`${currentMonthKey}.json`, new TextReader(JSON.stringify(currentMonthBuffer, null, 2)));
        }
        onProgress("Finalizing ZIP...");
        const blob = await zipWriter.close();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `diary_export_${new Date().toISOString().split('T')[0]}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        addToast("Export complete!", "success");
      } catch (error) {
        console.error("Export failed:", error);
        addToast("Export failed.", "error");
      }
  };

  const handleSignOut = async () => {
      await supabase.auth.signOut();
      navigate('/');
  };

  // Derived state for UI components
  // We need to map the current route to "activeView" string for LeftSidebar highlight
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

  // Prepare Context Value
  const contextValue: DiaryContextType = {
      entries, profile, loading, weather, uniqueJournals,
      refreshEntries: fetchEntries, loadEntryContent, saveEntry: handleInitiateSave, deleteEntry: handleDeleteEntry,
      updateProfile: handleUpdateProfile, uploadAvatar: handleAvatarUpload, exportData: handleExportData,
      theme, onToggleTheme, key, encryptBinary, session, signOut: handleSignOut,
      registerSaveHandler, isToolsPanelVisible, setToolsPanelVisible
  };

  return (
    <div className="h-screen w-screen flex flex-col font-sans bg-[#FBF8F3] dark:bg-slate-900">
       <TopBar
        isEditing={location.pathname.includes('/edit') || location.pathname.includes('/new')}
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
        theme={theme}
        onToggleTheme={onToggleTheme}
        saveStatus={saveStatus}
        profile={profile}
        onShowProfile={() => navigate('/app/profile')}
        isToolsPanelVisible={isToolsPanelVisible}
        onToggleToolsPanel={() => setToolsPanelVisible(prev => !prev)}
        isLeftSidebarVisible={isLeftSidebarVisible}
      />
      {!isLeftSidebarVisible && <HamburgerMenu onClick={() => setLeftSidebarVisible(true)} />}

      {isLeftSidebarVisible && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-20 md:hidden" onClick={() => setLeftSidebarVisible(false)} aria-hidden="true" />
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

        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto min-w-0 w-full relative">
            <Outlet context={contextValue} />
        </main>
      </div>

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
