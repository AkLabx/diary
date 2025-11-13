import React, { useState, useEffect, useCallback, useMemo } from 'react';
// Fix: Use 'import type' for Session to resolve potential module resolution issues with older Supabase versions.
import type { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabaseClient';
import { DiaryEntry, ViewState, Profile } from './types';
import Header from './components/Header';
import DiaryList from './components/DiaryList';
import DiaryEntryView from './components/DiaryEntryView';
import DiaryEditor from './components/DiaryEditor';
import CalendarView from './components/CalendarView';
import SearchView from './components/SearchView';
import { useCrypto } from './contexts/CryptoContext';
import InitializeEncryption from './components/InitializeEncryption';
import PasswordPrompt from './components/PasswordPrompt';
import { useToast } from './contexts/ToastContext';

interface DiaryAppProps {
  session: Session;
  theme: string;
  onToggleTheme: () => void;
}

type KeyStatus = 'checking' | 'needed' | 'reauth' | 'ready';

const DiaryApp: React.FC<DiaryAppProps> = ({ session, theme, onToggleTheme }) => {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewState, setViewState] = useState<ViewState>({ view: 'list' });
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const { key, setKey, encrypt, decrypt } = useCrypto();
  const [keyStatus, setKeyStatus] = useState<KeyStatus>('checking');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');
  const { addToast } = useToast();


  useEffect(() => {
    const checkKeyStatus = async () => {
      if (key) {
        setKeyStatus('ready');
        return;
      }

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', session.user.id)
          .maybeSingle();

        if (error) throw error;

        if (!profile) {
          // Profile does not exist. This is a new user who needs to set up encryption.
          setKeyStatus('needed');
        } else {
          // Profile exists. This is an existing user who needs to enter their password.
          setKeyStatus('reauth');
        }
      } catch (error) {
        console.error("Error checking profile for initialization:", error);
        addToast("There was a problem accessing your profile. Please log out and log in again.", "error");
        await supabase.auth.signOut();
      }
    };

    checkKeyStatus();
  }, [key, session.user.id]);

  const handleKeyReady = (newKey: CryptoKey) => {
    setKey(newKey);
    setKeyStatus('ready');
  };
  
  const fetchProfile = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      if (error) throw error;
      setProfile(data as Profile);
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  }, [session.user.id]);


  const fetchEntries = useCallback(async () => {
    if (!key) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('diaries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const decryptionResults = await Promise.allSettled(
        (data || []).map(async (entry) => {
          const decryptedContent = await decrypt(key, entry.encrypted_entry, entry.iv);
          const { title, content } = JSON.parse(decryptedContent);
          return {
            ...entry,
            title,
            content,
          };
        })
      );

      const successfullyDecryptedEntries = decryptionResults
        .filter((result): result is PromiseFulfilledResult<DiaryEntry> => result.status === 'fulfilled')
        .map(result => result.value);

      const failedCount = decryptionResults.length - successfullyDecryptedEntries.length;
      if (failedCount > 0) {
        console.warn(`${failedCount} entries could not be decrypted and were ignored. This can happen if data is corrupt or from a session with a different key.`);
      }

      setEntries(successfullyDecryptedEntries);
    } catch (error) {
      console.error("Error fetching entries from database:", error);
      addToast("Could not fetch diary entries. Please check your network connection.", "error");
    } finally {
      setLoading(false);
    }
  }, [key, decrypt, addToast]);

  useEffect(() => {
    if (keyStatus === 'ready') {
      fetchEntries();
      fetchProfile();
    }
  }, [fetchEntries, fetchProfile, keyStatus]);

  const filteredEntriesForList = useMemo(() => {
    if (!startDate && !endDate) {
      return entries;
    }
    
    return entries.filter(entry => {
      const entryDate = new Date(entry.created_at);
      entryDate.setHours(0, 0, 0, 0);
      
      let matchesDateRange = true;
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0,0,0,0);
        if (entryDate < start) matchesDateRange = false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(0,0,0,0);
        if (entryDate > end) matchesDateRange = false;
      }

      return matchesDateRange;
    });
  }, [entries, startDate, endDate]);
  
  const onThisDayEntries = useMemo(() => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentDay = today.getDate();
    return entries.filter(entry => {
      const entryDate = new Date(entry.created_at);
      return entryDate.getMonth() === currentMonth &&
             entryDate.getDate() === currentDay &&
             entryDate.getFullYear() < today.getFullYear();
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [entries]);

  const handleSaveEntry = useCallback(async (entryData: Omit<DiaryEntry, 'id' | 'owner_id' | 'created_at'> & { created_at: string }, id?: string) => {
    if (!key) {
        addToast("Security session expired. Please log in again.", "error");
        return;
    }
    try {
      const contentToEncrypt = JSON.stringify({
        title: entryData.title,
        content: entryData.content,
      });
      const { iv, data: encrypted_entry } = await encrypt(key, contentToEncrypt);

      if (id) {
        // Update existing entry
        const { error } = await supabase
          .from('diaries')
          .update({ encrypted_entry, iv, mood: entryData.mood, tags: entryData.tags })
          .eq('id', id);
        if (error) throw error;
        // The date/ownerId doesn't change, so we can just update the content part
        setEntries(prev => prev.map(e => e.id === id ? { ...e, title: entryData.title, content: entryData.content, mood: entryData.mood, tags: entryData.tags } : e));
      } else {
        // Create new entry
        const newEntryRecord = {
          owner_id: session.user.id,
          encrypted_entry,
          iv,
          mood: entryData.mood,
          tags: entryData.tags,
          created_at: entryData.created_at,
        };
        const { data, error } = await supabase
          .from('diaries')
          .insert(newEntryRecord)
          .select()
          .single();
        if (error) throw error;
        
        const newEntryForState: DiaryEntry = {
            ...data,
            title: entryData.title,
            content: entryData.content,
            mood: entryData.mood,
            tags: entryData.tags,
        };
        setEntries(prev => [newEntryForState, ...prev].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      }
      addToast('Entry saved successfully!', 'success');
      setViewState({ view: 'list' });
    } catch (error) {
      console.error("Error saving entry:", error);
      addToast("Failed to save entry. Please try again.", "error");
    }
  }, [session.user.id, key, encrypt, addToast]);

  const handleDeleteEntry = useCallback(async (id: string) => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      try {
        const { error } = await supabase.from('diaries').delete().eq('id', id);
        if (error) throw error;
        setEntries(prev => prev.filter(entry => entry.id !== id));
        setViewState({ view: 'list' });
        addToast('Entry deleted successfully.', 'success');
      } catch (error) {
        console.error("Error deleting entry:", error);
        addToast("Failed to delete entry. Please try again.", "error");
      }
    }
  }, [addToast]);
  
    const handleUpdateProfile = useCallback(async (updates: { full_name?: string, avatar_url?: string }) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', session.user.id)
        .select()
        .single();

      if (error) throw error;
      setProfile(data as Profile);
      addToast('Profile updated!', 'success');
    } catch (error) {
      console.error("Error updating profile:", error);
      addToast("Failed to update profile.", "error");
    }
  }, [session.user.id, addToast]);

  const handleAvatarUpload = useCallback(async (file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${session.user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      await handleUpdateProfile({ avatar_url: data.publicUrl });
    } catch (error) {
      console.error("Error uploading avatar:", error);
      addToast("Failed to upload avatar.", "error");
    }
  }, [session.user.id, handleUpdateProfile, addToast]);

  const handleSignOut = async () => {
      await supabase.auth.signOut();
  };
  
  const handleOpenExportModal = () => {
    setExportStartDate('');
    setExportEndDate('');
    setIsExportModalOpen(true);
  };
  
  const handleConfirmExport = () => {
     const entriesToExport = entries.filter(entry => {
      const entryDate = new Date(entry.created_at);
      entryDate.setHours(0, 0, 0, 0);

      let inRange = true;
      if (exportStartDate) {
        // By appending T00:00:00, we ensure the date is parsed in the user's local timezone,
        // avoiding inconsistencies with UTC-based parsing of date-only strings.
        const start = new Date(exportStartDate + 'T00:00:00');
        if (entryDate < start) inRange = false;
      }
      if (exportEndDate) {
        const end = new Date(exportEndDate + 'T00:00:00');
        if (entryDate > end) inRange = false;
      }
      return inRange;
    });
    
    if (entriesToExport.length === 0) {
      addToast("No entries found in the selected date range.", "info");
      return;
    }
    
    setIsExportModalOpen(false);

    if (window.confirm('This exported file will not be encrypted. Are you sure you want to continue?')) {
        const fileContent = entriesToExport
            .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) // sort oldest to newest
            .map(entry => {
                const date = new Date(entry.created_at).toLocaleString('en-US', {
                  year: 'numeric', month: 'long', day: 'numeric',
                  hour: 'numeric', minute: '2-digit', hour12: true
                });
                const mood = entry.mood ? `[Mood: ${entry.mood}]` : '';
                const tags = entry.tags?.length ? `[Tags: ${entry.tags.join(', ')}]` : '';
                const metadata = [mood, tags].filter(Boolean).join(' | ');

                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = entry.content;
                const textContent = tempDiv.textContent || tempDiv.innerText || '';

                return `Date: ${date}\nTitle: ${entry.title}\n${metadata ? `${metadata}\n` : ''}\n---\n${textContent}\n`;
            })
            .join('\n============================================================\n\n');

        const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `diary_export_${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        addToast('Entries exported successfully!', 'success');
    }
  };
  
  const handleGoHome = () => {
    setViewState({ view: 'list' });
    setStartDate(''); setEndDate('');
  };
  const handleGoToSearch = () => setViewState({ view: 'search' });
  const handleToggleView = () => setViewState(v => ({ view: v.view === 'list' || v.view === 'search' ? 'calendar' : 'list' }));
  const handleDateSelect = (date: Date) => {
    const isoDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().split("T")[0];
    setStartDate(isoDate); setEndDate(isoDate);
    setViewState({ view: 'list' });
  };

  if (keyStatus !== 'ready') {
    let content;
    switch (keyStatus) {
        case 'checking':
             content = (
                <div className="text-center py-20">
                    <h2 className="text-2xl font-semibold text-slate-600 dark:text-slate-300">Initializing Secure Session...</h2>
                    <p className="mt-2 text-slate-500 dark:text-slate-400">Please wait while we prepare your encrypted diary. If this takes too long, please try refreshing the page.</p>
                </div>
            );
            break;
        case 'needed':
            content = <InitializeEncryption onSuccess={handleKeyReady} session={session} />;
            break;
        case 'reauth':
            content = <PasswordPrompt onSuccess={handleKeyReady} session={session} />;
            break;
        default:
             content = <p>An unexpected error occurred.</p>
    }
    return (
      <main className="max-w-4xl mx-auto p-4 sm:p-6 md:p-8">
        {content}
      </main>
    );
  }

  const renderMainView = () => {
    if (loading) return <p className="text-center text-slate-500 dark:text-slate-400 mt-8">Loading your encrypted diary...</p>;

    switch (viewState.view) {
      case 'entry':
        const entryToView = entries.find(e => e.id === viewState.id);
        if (!entryToView) return <p>Entry not found.</p>;
        return <DiaryEntryView entry={entryToView} onEdit={() => setViewState({ view: 'edit', id: viewState.id })} onDelete={() => handleDeleteEntry(viewState.id)} />;
      case 'calendar':
        return <CalendarView entries={entries} onSelectDate={handleDateSelect} />;
      case 'search':
        return <SearchView entries={entries} onSelectEntry={(id) => setViewState({ view: 'entry', id })} />;
      case 'list':
      case 'new':
      case 'edit':
      default:
        return <DiaryList entries={filteredEntriesForList} totalEntries={entries.length} onThisDayEntries={onThisDayEntries} onSelectEntry={(id) => setViewState({ view: 'entry', id })} profile={profile} isFiltered={!!startDate || !!endDate} />;
    }
  };

  const isEditorActive = viewState.view === 'new' || viewState.view === 'edit';
  const entryToEdit = viewState.view === 'edit' ? entries.find(e => e.id === viewState.id) : undefined;
  
  return (
    <>
      <Header 
        session={session}
        profile={profile}
        entries={entries}
        onNewEntry={() => setViewState({ view: 'new' })}
        onGoHome={handleGoHome}
        onGoToSearch={handleGoToSearch}
        currentView={viewState.view}
        onToggleView={handleToggleView}
        onSignOut={handleSignOut}
        onUpdateProfile={handleUpdateProfile}
        onAvatarUpload={handleAvatarUpload}
        onOpenExportModal={handleOpenExportModal}
        theme={theme}
        onToggleTheme={onToggleTheme}
      />
      <main className="max-w-4xl mx-auto p-4 sm:p-6 md:p-8">
        {renderMainView()}
      </main>

      {/* Editor Panel */}
      <div 
        className={`
          fixed inset-0 z-30 bg-slate-50 dark:bg-slate-900
          transition-transform duration-300 ease-in-out
          ${isEditorActive ? 'translate-y-0' : 'translate-y-full'}
        `}
      >
        {isEditorActive && (viewState.view === 'new' || entryToEdit) && (
          <DiaryEditor
            key={viewState.view === 'edit' ? viewState.id : 'new'}
            entry={entryToEdit}
            onSave={handleSaveEntry}
            onCancel={() => {
              if (viewState.view === 'new') setViewState({ view: 'list' });
              else if (viewState.view === 'edit') setViewState({ view: 'entry', id: viewState.id });
            }}
          />
        )}
      </div>
      
      {isExportModalOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setIsExportModalOpen(false)}
        >
          <div 
            className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-sm border border-slate-200 dark:border-slate-700"
            onClick={(e) => e.stopPropagation()} // Prevents closing when clicking inside the modal
          >
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Export Entries</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-4">Select a date range. Leave blank to export all entries.</p>
            <div className="space-y-4">
              <div>
                <label htmlFor="start-date" className="text-sm font-medium text-slate-600 dark:text-slate-300">Start Date</label>
                <input 
                  id="start-date" 
                  type="date" 
                  value={exportStartDate} 
                  onChange={e => setExportStartDate(e.target.value)} 
                  className="w-full mt-1 border border-slate-300 rounded-md p-1.5 text-sm dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-indigo-500 dark:[color-scheme:dark]" 
                />
              </div>
              <div>
                <label htmlFor="end-date" className="text-sm font-medium text-slate-600 dark:text-slate-300">End Date</label>
                <input 
                  id="end-date" 
                  type="date" 
                  value={exportEndDate} 
                  onChange={e => setExportEndDate(e.target.value)} 
                  className="w-full mt-1 border border-slate-300 rounded-md p-1.5 text-sm dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-indigo-500 dark:[color-scheme:dark]" 
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setIsExportModalOpen(false)} className="px-4 py-2 font-semibold text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors">Cancel</button>
              <button onClick={handleConfirmExport} className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors">Confirm Export</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DiaryApp;