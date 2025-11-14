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

interface DiaryAppProps {
  session: Session;
  theme: string;
  onToggleTheme: () => void;
}

type KeyStatus = 'checking' | 'needed' | 'reauth' | 'ready';

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

  const fetchEntries = useCallback(async () => {
    if (!key) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.from('diaries').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      
      const results = await Promise.allSettled(
        (data || []).map(async (entry) => {
          const decrypted = await decrypt(key, entry.encrypted_entry, entry.iv);
          const { title, content } = JSON.parse(decrypted);
          return { ...entry, title, content };
        })
      );

      const decryptedEntries = results
        .filter((r): r is PromiseFulfilledResult<DiaryEntry> => r.status === 'fulfilled')
        .map(r => r.value);
      
      setEntries(decryptedEntries);
    } catch (error) {
      console.error("Error fetching entries:", error);
      addToast("Could not fetch entries.", "error");
    } finally { setLoading(false); }
  }, [key, decrypt, addToast]);

  useEffect(() => {
    if (keyStatus === 'ready') {
      fetchEntries();
      fetchProfile();
    }
  }, [fetchEntries, fetchProfile, keyStatus]);

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
        setEntries(prev => prev.map(e => e.id === editingEntry.id ? { ...e, ...entryData } : e));
      } else {
        const { data, error } = await supabase.from('diaries').insert({ ...record, owner_id: session.user.id }).select().single();
        if (error) throw error;
        setEntries(prev => [{ ...data, ...entryData }, ...prev].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
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
    if (!entryToDelete) return;

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
    }
  };
  
  const handleDateSelect = (date: Date) => {
    const localDateString = toLocalDateString(date);
    const selected = entries.find(e => toLocalDateString(new Date(e.created_at)) === localDateString);
    setSelectedEntry(selected || null);
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
    if (entries.length === 0) {
      addToast("You have no entries to export.", "info");
      return;
    }
    const dataStr = JSON.stringify(entries.map(({title, content, created_at, tags, mood}) => ({title, content, created_at, tags, mood})), null, 2);
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
    if (loading) return <p className="text-center text-slate-500 dark:text-slate-400 mt-8">Loading your encrypted diary...</p>;

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
        return <DiaryList entries={entries} onThisDayEntries={onThisDayEntries} onSelectEntry={(id) => setSelectedEntry(entries.find(e => e.id === id) || null)} profile={profile} />;
    }
  };

  const changeView = (view: ViewState) => {
    setSelectedEntry(null);
    setEditingEntry(null);
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
        onClose={() => setEntryToDelete(null)}
        onConfirm={handleDeleteEntry}
        title="Delete Entry?"
        message="Are you sure you want to permanently delete this entry? This action cannot be undone."
      />
    </div>
  );
};

export default DiaryApp;