import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabaseClient';
import { DiaryEntry, ViewState, Profile, Weather } from './types';
import { useCrypto } from './contexts/CryptoContext';
import { useToast } from './contexts/ToastContext';
import { fetchWeather } from './lib/weather';

import LeftSidebar from './components/LeftSidebar';
import TopBar from './components/TopBar';
import StatusBar from './components/StatusBar';
import ToolsPanel from './components/ToolsPanel';
import DiaryList from './components/DiaryList';
import DiaryEntryView from './components/DiaryEntryView';
import DiaryEditor, { EditorHandle } from './components/DiaryEditor';
import CalendarView from './components/CalendarView';
import SearchView from './components/SearchView';
import InitializeEncryption from './components/InitializeEncryption';
import PasswordPrompt from './components/PasswordPrompt';
import ProfileView from './components/ProfileView';
import HamburgerMenu from './components/HamburgerMenu';
import ConfirmationModal from './components/ConfirmationModal';

// Fix: RangeStatic is not exported as a named export from 'quill' in some type definitions.
// Defining it locally ensures compatibility.
interface RangeStatic {
  index: number;
  length: number;
}

interface DiaryAppProps {
  session: Session;
  theme: string;
  onToggleTheme: () => void;
}

type KeyStatus = 'checking' | 'needed' | 'reauth' | 'ready';
type SelectedImageFormat = { align?: string; width?: string; float?: string };

const DiaryApp: React.FC<DiaryAppProps> = ({ session, theme, onToggleTheme }) => {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<ViewState>('timeline');
  
  const [editingEntry, setEditingEntry] = useState<DiaryEntry | 'new' | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<DiaryEntry | null>(null);
  
  const { key, setKey, encrypt, decrypt } = useCrypto();
  const [keyStatus, setKeyStatus] = useState<KeyStatus>('checking');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLeftSidebarVisible, setLeftSidebarVisible] = useState(true);
  const [isToolsPanelVisible, setToolsPanelVisible] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'synced' | 'encrypting' | 'error'>('synced');
  const [weather, setWeather] = useState<Weather | null>(null);
  const [wordCount, setWordCount] = useState(0);
  const [characterCount, setCharacterCount] = useState(0);
  const editorRef = useRef<EditorHandle>(null);
  const [editorFont, setEditorFont] = useState<'serif' | 'sans' | 'mono'>('serif');
  const [entryToDelete, setEntryToDelete] = useState<DiaryEntry | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [selectedImageFormat, setSelectedImageFormat] = useState<SelectedImageFormat | null>(null);

  // Ref to track loading promises to avoid duplicate requests
  const loadingEntriesRef = useRef<Set<string>>(new Set());

  const { addToast } = useToast();

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
        await supabase.auth.signOut();
      }
    };
    checkKeyStatus();
  }, [key, session.user.id, addToast]);

  const handleKeyReady = (newKey: CryptoKey) => {
    setKey(newKey);
    setKeyStatus('ready');
  };
  
  const fetchProfile = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
      if (error) throw error;
      setProfile(data as Profile);
    } catch (error) { console.error("Error fetching profile:", error); }
  }, [session.user.id]);

  // PERFORMANCE UPDATE: Only fetch metadata initially
  const fetchEntries = useCallback(async () => {
    if (!key) return;
    setLoading(true);
    try {
      // Select only lightweight metadata columns. DO NOT fetch encrypted_entry yet.
      const { data, error } = await supabase
        .from('diaries')
        .select('id, created_at, mood, tags, owner_id')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      // Initialize entries with placeholders for title/content and flags
      const initialEntries: DiaryEntry[] = (data || []).map((entry) => ({
        id: entry.id,
        created_at: entry.created_at,
        mood: entry.mood,
        tags: entry.tags,
        owner_id: entry.owner_id,
        title: '', // Placeholder
        content: '', // Placeholder
        isDecrypted: false,
        isLoading: false
      }));

      setEntries(initialEntries);
    } catch (error) {
      console.error("Error fetching entries:", error);
      addToast("Could not fetch entries.", "error");
    } finally { setLoading(false); }
  }, [key, addToast]);

  // PERFORMANCE UPDATE: Function to load content on demand
  const loadEntryContent = useCallback(async (id: string) => {
    // Prevent duplicate fetches for the same ID
    if (loadingEntriesRef.current.has(id) || !key) return;

    const entryIndex = entries.findIndex(e => e.id === id);
    if (entryIndex === -1) return;
    
    // If already decrypted, do nothing
    if (entries[entryIndex].isDecrypted) return;

    loadingEntriesRef.current.add(id);
    
    // Optimistic update to show loading state
    setEntries(prev => prev.map(e => e.id === id ? { ...e, isLoading: true } : e));

    try {
        const { data, error } = await supabase
            .from('diaries')
            .select('encrypted_entry, iv')
            .eq('id', id)
            .single();

        if (error) throw error;

        const decrypted = await decrypt(key, data.encrypted_entry, data.iv);
        const { title, content } = JSON.parse(decrypted);

        setEntries(prev => prev.map(e => e.id === id ? {
            ...e,
            title,
            content,
            isDecrypted: true,
            isLoading: false
        } : e));

    } catch (error) {
        console.error(`Error decrypting entry ${id}:`, error);
        // Reset loading state so retry is possible
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
  
  // If selected entry is not decrypted, load it immediately
  useEffect(() => {
    if (selectedEntry && !selectedEntry.isDecrypted && !selectedEntry.isLoading) {
        loadEntryContent(selectedEntry.id);
    }
  }, [selectedEntry, loadEntryContent]);
  
  // Update selectedEntry when entries state changes (e.g. after decryption)
  useEffect(() => {
    if (selectedEntry) {
        const updated = entries.find(e => e.id === selectedEntry.id);
        if (updated && (updated.isDecrypted !== selectedEntry.isDecrypted || updated.isLoading !== selectedEntry.isLoading)) {
            setSelectedEntry(updated);
        }
    }
  }, [entries, selectedEntry]);

  // Effect to listen for editor selection changes to show contextual image tools
  useEffect(() => {
    if (!editorRef.current || !editingEntry) return;

    const quill = editorRef.current.getEditor();
    if (!quill) return;
    
    const handler = (range: RangeStatic | null) => {
        if (range && range.length === 0) {
            const [blot] = quill.getLeaf(range.index);
            if (blot && blot.statics.blotName === 'image') {
                const formats = quill.getFormat(range.index, 1);
                const parentFormats = quill.getFormat(range.index - 1, 1);
                setSelectedImageFormat({
                    width: formats.width,
                    align: parentFormats.align,
                    float: formats.float,
                });
            } else {
                setSelectedImageFormat(null);
            }
        } else if (!range) {
             setSelectedImageFormat(null);
        }
    };

    quill.on('selection-change', handler);

    return () => {
        quill.off('selection-change', handler);
    };
  }, [editingEntry]);


  const onThisDayEntries = useMemo(() => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentDay = today.getDate();
    return entries.filter(entry => {
      const entryDate = new Date(entry.created_at);
      return entryDate.getMonth() === currentMonth && entryDate.getDate() === currentDay && entryDate.getFullYear() < today.getFullYear();
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [entries]);

  const handleSaveEntry = useCallback(async (entryData: Omit<DiaryEntry, 'id' | 'owner_id'>) => {
    if (!key) { addToast("Security session expired.", "error"); return; }
    if (!editingEntry) { addToast("Cannot save: no entry is currently being edited.", "error"); return; }
    
    setSaveStatus('encrypting');
    try {
      const contentToEncrypt = JSON.stringify({ title: entryData.title, content: entryData.content });
      const { iv, data: encrypted_entry } = await encrypt(key, contentToEncrypt);

      const isUpdate = typeof editingEntry === 'object' && 'id' in editingEntry;
      const record = {
        encrypted_entry, iv,
        mood: entryData.mood, tags: entryData.tags,
        created_at: entryData.created_at
      };

      if (isUpdate) {
        const { error } = await supabase.from('diaries').update(record).eq('id', editingEntry.id);
        if (error) throw error;
        // Ensure we mark the updated entry as decrypted since we just wrote it
        setEntries(prev => prev.map(e => e.id === editingEntry.id ? { ...e, ...entryData, isDecrypted: true } : e));
      } else {
        const { data, error } = await supabase.from('diaries').insert({ ...record, owner_id: session.user.id }).select('id, created_at, mood, tags, owner_id').single();
        if (error) throw error;
        // New entry is definitely decrypted in memory
        const newEntry: DiaryEntry = { ...data, ...entryData, isDecrypted: true, isLoading: false };
        setEntries(prev => [newEntry, ...prev].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      }
      addToast('Entry saved!', 'success');
      setEditingEntry(null);
      setActiveView('timeline');
      setLeftSidebarVisible(true);
      setSaveStatus('synced');
    } catch (error) {
      console.error("Error saving entry:", error);
      addToast("Failed to save entry.", "error");
      setSaveStatus('error');
    }
  }, [session.user.id, key, encrypt, addToast, editingEntry]);

  const requestDeleteEntry = (entry: DiaryEntry) => {
    setEntryToDelete(entry);
  };

  const handleDeleteEntry = async () => {
    if (!entryToDelete || isDeleting) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('diaries')
        .delete()
        .eq('id', entryToDelete.id);

      if (error) throw error;

      setEntries(prev => prev.filter(e => e.id !== entryToDelete.id));
      addToast('Entry deleted successfully.', 'success');
      setSelectedEntry(null);
      setEntryToDelete(null);
    } catch (error) {
      console.error("Error deleting entry:", error);
      addToast("Failed to delete entry.", "error");
      setEntryToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };
  
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedEntry(null);
    setActiveView('timeline');
  };

  const handleSignOut = async () => { await supabase.auth.signOut(); };

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

      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
      
      const { error: updateError } = await supabase.from('profiles').update({ avatar_url: data.publicUrl }).eq('id', session.user.id);
      if (updateError) throw updateError;
      
      setProfile(prev => prev ? { ...prev, avatar_url: data.publicUrl } : null);
      addToast("Avatar updated!", "success");
    } catch (error) {
      addToast("Failed to upload avatar.", "error");
      console.error("Error uploading avatar:", error);
    }
  };

  const handleExportData = () => {
     // NOTE: Export now triggers a load of all entries if not loaded.
     // For now, we simply export what is loaded to avoid mass-decryption of thousands of entries which would crash the browser.
     // In a production app, we would stream this or handle it server-side (but we can't due to client-side encryption).
     // Best effort: warn user.
     const loadedEntries = entries.filter(e => e.isDecrypted);
     if (loadedEntries.length < entries.length) {
         addToast(`Exporting ${loadedEntries.length} loaded entries. Scroll down to load more before exporting.`, "info");
     }
    
    if (loadedEntries.length === 0) {
      addToast("No loaded entries to export.", "info");
      return;
    }
    
    const dataStr = JSON.stringify(loadedEntries.map(({title, content, created_at, tags, mood}) => ({title, content, created_at, tags, mood})), null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `diary_export_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addToast("Data exported successfully!", "success");
  };
  
  const handleImageUpload = async (file: File) => {
    const quill = editorRef.current?.getEditor();
    if (!quill) return;
    
    setIsUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${session.user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage.from('diary-images').upload(fileName, file);
      if (uploadError) throw uploadError;
      
      const { data } = supabase.storage.from('diary-images').getPublicUrl(fileName);
      
      const range = quill.getSelection(true);
      quill.insertEmbed(range.index, 'image', data.publicUrl, 'user');
      quill.setSelection(range.index + 1, 0, 'user');
      
    } catch (error) {
      addToast("Failed to upload image.", "error");
      console.error("Error uploading image:", error);
    } finally {
      setIsUploadingImage(false);
    }
  };
  
  const handleImageFormatChange = (formats: { [key: string]: any }) => {
    const quill = editorRef.current?.getEditor();
    if (!quill) return;

    Object.keys(formats).forEach(formatName => {
        quill.format(formatName, formats[formatName], 'user');
    });

    setTimeout(() => {
        const range = quill.getSelection();
        if(range) (quill as any).emitter.emit('selection-change', range, range, 'user');
    }, 0);
  };


  const toLocalDateString = (date: Date): string => {
    return new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().split("T")[0];
  };

  const handleEditEntry = (entry: DiaryEntry) => {
    setSelectedEntry(null);
    setEditingEntry(entry);
    setLeftSidebarVisible(false);
  };
  
  const handleNewEntry = () => {
    setSelectedEntry(null);
    setEditingEntry('new');
    setActiveView('timeline');
    setLeftSidebarVisible(false);
  };

  const handleCancelEdit = () => {
    setEditingEntry(null);
    setLeftSidebarVisible(true);
  }

  const handleTriggerSave = () => {
    editorRef.current?.save();
  };

  if (keyStatus !== 'ready') {
    let content;
    switch (keyStatus) {
        case 'checking': content = <p>Initializing Secure Session...</p>; break;
        case 'needed': content = <InitializeEncryption onSuccess={handleKeyReady} session={session} />; break;
        case 'reauth': content = <PasswordPrompt onSuccess={handleKeyReady} session={session} />; break;
        default: content = <p>An unexpected error occurred.</p>;
    }
    return <main className="flex items-center justify-center h-screen">{content}</main>;
  }

  const renderMainView = () => {
    switch (activeView) {
      case 'calendar': return <CalendarView entries={entries} onSelectDate={handleDateSelect} />;
      case 'search': return <SearchView entries={entries} onSelectEntry={(id) => handleEditEntry(entries.find(e => e.id === id)!)} />;
      case 'profile': return (
        <ProfileView
            session={session}
            profile={profile}
            onUpdateProfile={handleUpdateProfile}
            onAvatarUpload={handleAvatarUpload}
            onExportData={handleExportData}
            onSignOut={handleSignOut}
            theme={theme}
            onToggleTheme={onToggleTheme}
        />
      );
      case 'timeline':
      default:
        if (selectedEntry) {
          return <DiaryEntryView 
                    entry={selectedEntry} 
                    onEdit={() => handleEditEntry(selectedEntry)}
                    onDelete={() => requestDeleteEntry(selectedEntry)}
                  />
        }
        const entriesToShow = selectedDate
          ? entries.filter(e => toLocalDateString(new Date(e.created_at)) === toLocalDateString(selectedDate))
          : entries;

        return <DiaryList 
                  entries={entriesToShow} 
                  onThisDayEntries={onThisDayEntries} 
                  onSelectEntry={(id) => setSelectedEntry(entries.find(e => e.id === id) || null)} 
                  onLoadContent={loadEntryContent}
                  profile={profile}
                  filteredDate={selectedDate}
                  onClearFilter={() => setSelectedDate(null)}
               />;
    }
  };

  const changeView = (view: ViewState) => {
    setSelectedEntry(null);
    setEditingEntry(null);
    setSelectedDate(null);
    setActiveView(view);
    setLeftSidebarVisible(true);
  };

  return (
    <div className="h-screen w-screen flex flex-col font-sans bg-[#FBF8F3] dark:bg-slate-900">
      <TopBar 
        isEditing={!!editingEntry}
        onSave={handleTriggerSave}
        onCancel={handleCancelEdit}
        currentDate={editingEntry && typeof editingEntry === 'object' ? new Date(editingEntry.created_at) : (selectedEntry ? new Date(selectedEntry.created_at) : new Date())}
        weather={weather}
        theme={theme}
        onToggleTheme={onToggleTheme}
        saveStatus={saveStatus}
        profile={profile}
        onShowProfile={() => changeView('profile')}
        isToolsPanelVisible={isToolsPanelVisible}
        onToggleToolsPanel={() => setToolsPanelVisible(p => !p)}
        isLeftSidebarVisible={isLeftSidebarVisible}
      />
      {!isLeftSidebarVisible && <HamburgerMenu onClick={() => setLeftSidebarVisible(true)} />}
      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar 
          isVisible={isLeftSidebarVisible}
          onClose={() => setLeftSidebarVisible(false)}
          activeView={activeView}
          onChangeView={changeView}
          onNewEntry={handleNewEntry}
        />
        <div className={`flex-1 flex transition-all duration-300 ${isLeftSidebarVisible ? 'md:pl-64' : 'pl-0'}`}>
          <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto">
            {editingEntry ? (
              <DiaryEditor 
                ref={editorRef}
                key={typeof editingEntry === 'object' ? editingEntry.id : 'new'}
                entry={typeof editingEntry === 'object' ? editingEntry : undefined}
                onSave={handleSaveEntry}
                onWordCountChange={setWordCount}
                onCharacterCountChange={setCharacterCount}
                editorFont={editorFont}
              />
            ) : loading ? (
               <div className="flex items-center justify-center h-full">
                  <div className="flex flex-col items-center justify-center gap-4 text-slate-500 dark:text-slate-400">
                      <svg className="animate-spin h-12 w-12" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <p className="text-sm">Loading your encrypted diary...</p>
                  </div>
              </div>
            ) : (
               renderMainView()
            )}
          </main>
          {editingEntry && isToolsPanelVisible && (
            <ToolsPanel 
              entry={editingEntry}
              onUpdateEntry={(updates) => {
                  if (editingEntry === 'new') {
                      setEditingEntry({
                        id: '', owner_id: '', title: '', content: '',
                        created_at: new Date().toISOString(),
                        ...updates
                      });
                  } else {
                      setEditingEntry(prev => ({ ...(prev as DiaryEntry), ...updates }));
                  }
              }}
              editorFont={editorFont}
              onFontChange={setEditorFont}
              onImageUpload={handleImageUpload}
              isUploadingImage={isUploadingImage}
              selectedImageFormat={selectedImageFormat}
              onImageFormatChange={handleImageFormatChange}
            />
          )}
        </div>
      </div>
      {editingEntry && (
        <StatusBar 
          wordCount={wordCount}
          characterCount={characterCount}
          saveStatus={saveStatus} 
        />
      )}
      <ConfirmationModal
        isOpen={!!entryToDelete}
        isProcessing={isDeleting}
        onClose={() => setEntryToDelete(null)}
        onConfirm={handleDeleteEntry}
        title="Delete Entry?"
        message="Are you sure you want to permanently delete this entry? This action cannot be undone."
      />
    </div>
  );
};

export default DiaryApp;