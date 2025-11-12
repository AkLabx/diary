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

interface DiaryAppProps {
  session: Session;
}

const DiaryApp: React.FC<DiaryAppProps> = ({ session }) => {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewState, setViewState] = useState<ViewState>({ view: 'list' });
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const { key, encrypt, decrypt } = useCrypto();

  const fetchEntries = useCallback(async () => {
    if (!key) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('diaries')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      
      const decryptedEntries: DiaryEntry[] = await Promise.all(
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

      setEntries(decryptedEntries);
    } catch (error) {
      console.error("Error fetching or decrypting entries:", error);
      alert("Could not load your diary. The data may be corrupt or the encryption key is wrong.");
    } finally {
      setLoading(false);
    }
  }, [key, decrypt]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      const entryDate = new Date(entry.date);
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
      const entryDate = new Date(entry.date);
      return entryDate.getMonth() === currentMonth &&
             entryDate.getDate() === currentDay &&
             entryDate.getFullYear() < today.getFullYear();
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [entries]);

  const handleSaveEntry = useCallback(async (entryData: Omit<DiaryEntry, 'id' | 'date' | 'owner_id' | 'created_at'>, id?: string) => {
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
          date: new Date().toISOString(),
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
        setEntries(prev => [newEntryForState, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
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
    if (!key) {
        return (
            <div className="text-center py-20">
                <h2 className="text-2xl font-semibold text-slate-600">Initializing Secure Session...</h2>
                <p className="mt-2 text-slate-500">Please wait while we prepare your encrypted diary. If this takes too long, please try refreshing the page.</p>
            </div>
        );
    }
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
  };

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