import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabaseClient';
import { DiaryEntry, ViewState } from './types';
import Header from './components/Header';
import DiaryList from './components/DiaryList';
import DiaryEntryView from './components/DiaryEntryView';
import DiaryEditor from './components/DiaryEditor';
import CalendarView from './components/CalendarView';
import { useCrypto } from './contexts/CryptoContext';
import InitializeEncryption from './components/InitializeEncryption';
import PasswordPrompt from './components/PasswordPrompt';

interface DiaryAppProps {
  session: Session;
}

type KeyStatus = 'checking' | 'needed' | 'reauth' | 'ready';

const DiaryApp: React.FC<DiaryAppProps> = ({ session }) => {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewState, setViewState] = useState<ViewState>({ view: 'list' });
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const { key, setKey, encrypt, decrypt } = useCrypto();
  const [keyStatus, setKeyStatus] = useState<KeyStatus>('checking');

  useEffect(() => {
    const checkKeyStatus = async () => {
      if (key) {
        setKeyStatus('ready');
        return;
      }

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('salt')
          .eq('id', session.user.id)
          .single();

        if (error) throw error;

        if (profile && profile.salt === 'INITIAL_SALT') {
          // New user who has confirmed email but not set up encryption key yet.
          setKeyStatus('needed');
        } else if (profile) {
          // Existing user who has refreshed the page. Session exists but in-memory key is lost.
          // Prompt for password to re-derive the key.
          setKeyStatus('reauth');
        } else {
            throw new Error("User profile not found. This should not happen.");
        }
      } catch (error) {
        console.error("Error checking profile for initialization:", error);
        alert("There was a problem accessing your profile. Please log out and log in again.");
        await supabase.auth.signOut();
      }
    };

    checkKeyStatus();
  }, [key, session.user.id]);

  const handleKeyReady = (newKey: CryptoKey) => {
    setKey(newKey);
    setKeyStatus('ready');
  };

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
      alert("Could not fetch diary entries. Please check your network connection.");
    } finally {
      setLoading(false);
    }
  }, [key, decrypt]);

  useEffect(() => {
    if (keyStatus === 'ready') {
      fetchEntries();
    }
  }, [fetchEntries, keyStatus]);

  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      const entryDate = new Date(entry.created_at);
      entryDate.setHours(0, 0, 0, 0);

      const matchesSearchTerm = searchTerm.trim() === '' ||
        entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.content.toLowerCase().includes(searchTerm.toLowerCase());
      
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

      return matchesSearchTerm && matchesDateRange;
    });
  }, [entries, searchTerm, startDate, endDate]);
  
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

  const handleSaveEntry = useCallback(async (entryData: Omit<DiaryEntry, 'id' | 'owner_id' | 'created_at'>, id?: string) => {
    if (!key) {
        alert("Security session expired. Please log in again.");
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
          .update({ encrypted_entry, iv })
          .eq('id', id);
        if (error) throw error;
        // The date/ownerId doesn't change, so we can just update the content part
        setEntries(prev => prev.map(e => e.id === id ? { ...e, title: entryData.title, content: entryData.content } : e));
      } else {
        // Create new entry
        const newEntryRecord = {
          owner_id: session.user.id,
          encrypted_entry,
          iv,
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
            content: entryData.content
        };
        setEntries(prev => [newEntryForState, ...prev].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      }
      setViewState({ view: 'list' });
    } catch (error) {
      console.error("Error saving entry:", error);
      alert("Failed to save entry. Please try again.");
    }
  }, [session.user.id, key, encrypt]);

  const handleDeleteEntry = useCallback(async (id: string) => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      try {
        const { error } = await supabase.from('diaries').delete().eq('id', id);
        if (error) throw error;
        setEntries(prev => prev.filter(entry => entry.id !== id));
        setViewState({ view: 'list' });
      } catch (error) {
        console.error("Error deleting entry:", error);
        alert("Failed to delete entry. Please try again.");
      }
    }
  }, []);
  
  const handleSignOut = async () => {
      await supabase.auth.signOut();
  };
  const handleGoHome = () => {
    setViewState({ view: 'list' });
    setSearchTerm(''); setStartDate(''); setEndDate('');
  };
  const handleToggleView = () => setViewState(v => ({ view: v.view === 'list' ? 'calendar' : 'list' }));
  const handleDateSelect = (date: Date) => {
    const isoDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().split("T")[0];
    setStartDate(isoDate); setEndDate(isoDate);
    setViewState({ view: 'list' });
  };

  const renderContent = () => {
    switch (keyStatus) {
        case 'checking':
             return (
                <div className="text-center py-20">
                    <h2 className="text-2xl font-semibold text-slate-600">Initializing Secure Session...</h2>
                    <p className="mt-2 text-slate-500">Please wait while we prepare your encrypted diary. If this takes too long, please try refreshing the page.</p>
                </div>
            );
        case 'needed':
            return <InitializeEncryption onSuccess={handleKeyReady} session={session} />;
        case 'reauth':
            return <PasswordPrompt onSuccess={handleKeyReady} session={session} />;
        case 'ready':
            if (loading) return <p className="text-center text-slate-500 mt-8">Loading your encrypted diary...</p>;
    
            switch (viewState.view) {
              case 'entry':
                const entryToView = entries.find(e => e.id === viewState.id);
                if (!entryToView) return <p>Entry not found.</p>;
                return <DiaryEntryView entry={entryToView} onEdit={() => setViewState({ view: 'edit', id: viewState.id })} onDelete={() => handleDeleteEntry(viewState.id)} />;
              case 'edit':
                const entryToEdit = entries.find(e => e.id === viewState.id);
                if (!entryToEdit) return <p>Entry not found.</p>;
                return <DiaryEditor entry={entryToEdit} onSave={handleSaveEntry} onCancel={() => setViewState({ view: 'entry', id: viewState.id })} />;
              case 'new':
                return <DiaryEditor onSave={handleSaveEntry} onCancel={() => setViewState({ view: 'list' })} />;
              case 'calendar':
                return <CalendarView entries={entries} onSelectDate={handleDateSelect} />;
              case 'list':
              default:
                return <DiaryList entries={filteredEntries} totalEntries={entries.length} onThisDayEntries={onThisDayEntries} onSelectEntry={(id) => setViewState({ view: 'entry', id })} />;
            }
        default:
             return <p>An unexpected error occurred.</p>
    }
  };
  
  if (keyStatus !== 'ready') {
    return (
      <main className="max-w-4xl mx-auto p-4 sm:p-6 md:p-8">
        {renderContent()}
      </main>
    );
  }

  return (
    <>
      <Header 
        onNewEntry={() => setViewState({ view: 'new' })}
        onGoHome={handleGoHome}
        currentView={viewState.view}
        onToggleView={handleToggleView}
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        startDate={startDate}
        onStartDateChange={setStartDate}
        endDate={endDate}
        onEndDateChange={setEndDate}
        onSignOut={handleSignOut}
      />
      <main className="max-w-4xl mx-auto p-4 sm:p-6 md:p-8">
        {renderContent()}
      </main>
    </>
  );
};

export default DiaryApp;