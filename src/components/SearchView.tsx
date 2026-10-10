import React, { useState, useMemo, useRef, useEffect } from 'react';
import { DiaryEntry } from '../types';
import { formatTimestamp } from '../lib/dateUtils';

interface SearchViewProps {
  entries: DiaryEntry[];
  onSelectEntry: (id: string) => void;
  onBack: () => void;
}

const moods = ['😊', '😢', '😠', '😎', '🤔', '😍', '😴', '🥳'];

const SearchView: React.FC<SearchViewProps> = ({ entries, onSelectEntry, onBack }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [isDateOpen, setDateOpen] = useState(false);
  const [isMoodOpen, setMoodOpen] = useState(false);
  const [isTagsOpen, setTagsOpen] = useState(false);

  const dateRef = useRef<HTMLDivElement>(null);
  const moodRef = useRef<HTMLDivElement>(null);
  const tagsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dateRef.current && !dateRef.current.contains(event.target as Node)) setDateOpen(false);
      if (moodRef.current && !moodRef.current.contains(event.target as Node)) setMoodOpen(false);
      if (tagsRef.current && !tagsRef.current.contains(event.target as Node)) setTagsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    entries.forEach(entry => {
      entry.tags?.forEach(tag => tagsSet.add(tag));
    });
    return Array.from(tagsSet).sort();
  }, [entries]);

  const stripHtml = (html: string) => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || "";
  };

  const filteredEntries = useMemo(() => {
    const isAnyFilterActive = searchTerm.trim() !== '' || selectedMood || selectedTags.length > 0 || startDate || endDate;
    if (!isAnyFilterActive) return [];

    return entries.filter(entry => {
      const lowerSearchTerm = searchTerm.toLowerCase();
      // Note: Search only works on loaded/decrypted content. Tags and Moods work globally.
      const matchesSearch = searchTerm.trim() === '' ||
        (entry.title || '').toLowerCase().includes(lowerSearchTerm) ||
        stripHtml(entry.content || '').toLowerCase().includes(lowerSearchTerm);

      const matchesMood = !selectedMood || entry.mood === selectedMood;

      const matchesTags = selectedTags.length === 0 ||
        selectedTags.every(tag => entry.tags?.includes(tag));

      let matchesDateRange = true;
      if (startDate || endDate) {
        const entryDate = new Date(entry.created_at);
        entryDate.setHours(0, 0, 0, 0);
        if (startDate) {
          const start = new Date(startDate + 'T00:00:00');
          if (entryDate < start) matchesDateRange = false;
        }
        if (endDate) {
          const end = new Date(endDate + 'T00:00:00');
          if (entryDate > end) matchesDateRange = false;
        }
      }
      
      return matchesSearch && matchesMood && matchesTags && matchesDateRange;
    });
  }, [entries, searchTerm, selectedMood, selectedTags, startDate, endDate]);
  
  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const hasActiveFilter = searchTerm.trim() !== '' || selectedMood || selectedTags.length > 0 || startDate || endDate;

  return (
    <div className="space-y-6 animate-fade-in">
      <button
        onClick={onBack}
        className="flex items-center text-sm font-medium text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors group"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 transform group-hover:-translate-x-1 transition-transform" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
        </svg>
        Back to Timeline
      </button>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-4">Search Past Entries</h1>
        <div className="relative">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            placeholder="Search by keywords, title, or date..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base dark:bg-slate-700 dark:text-slate-200 dark:placeholder-slate-400"
            aria-label="Search diary entries"
          />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {/* Date Range Filter */}
          <div className="relative" ref={dateRef}>
            <button onClick={() => setDateOpen(p => !p)} className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-slate-100 dark:bg-slate-700 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-500 dark:text-slate-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" /></svg>
              <span>Date Range</span>
            </button>
            {isDateOpen && (
              <div className="absolute top-full left-0 mt-2 bg-white dark:bg-slate-800 p-4 rounded-lg shadow-xl border dark:border-slate-700 z-10 w-64 space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500">From</label>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full mt-1 border border-slate-300 rounded-md p-1.5 text-sm dark:bg-slate-700 dark:border-slate-600 dark:[color-scheme:dark]" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500">To</label>
                  <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full mt-1 border border-slate-300 rounded-md p-1.5 text-sm dark:bg-slate-700 dark:border-slate-600 dark:[color-scheme:dark]" />
                </div>
              </div>
            )}
          </div>
          {/* Mood Filter */}
          <div className="relative" ref={moodRef}>
             <button onClick={() => setMoodOpen(p => !p)} className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-slate-100 dark:bg-slate-700 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600">
              {selectedMood ? <span className="text-lg">{selectedMood}</span> : <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500 dark:text-slate-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-.464 5.535a.5.5 S0 01.708 0 5 5 0 01-6.488 0 .5.5 0 01.708-.707A4 4 0 0013 12.5a.5.5 0 01.535.464z" clipRule="evenodd" /></svg>}
              <span>Mood</span>
            </button>
            {isMoodOpen && (
              <div className="absolute top-full left-0 mt-2 bg-white dark:bg-slate-800 p-2 rounded-lg shadow-xl border dark:border-slate-700 z-10 grid grid-cols-4 gap-2 w-64">
                {moods.map(m => (
                  <button key={m} type="button" onClick={() => { setSelectedMood(m === selectedMood ? null : m); setMoodOpen(false); }} className={`text-3xl p-2 rounded-md transition-all ${selectedMood === m ? 'bg-indigo-100 dark:bg-indigo-500/50 scale-110' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`}>{m}</button>
                ))}
              </div>
            )}
          </div>
          {/* Tags Filter */}
          <div className="relative" ref={tagsRef}>
             <button onClick={() => setTagsOpen(p => !p)} className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-slate-100 dark:bg-slate-700 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-500 dark:text-slate-400" viewBox="0 0 20 20" fill="currentColor"><path d="M5.5 16a3.5 3.5 0 01-3.5-3.5V5.5A3.5 3.5 0 015.5 2h5.086a2 2 0 011.414.586l4.414 4.414a2 2 0 01.586 1.414V12.5A3.5 3.5 0 0113.5 16h-8z" /></svg>
              <span>Tags</span>
            </button>
             {isTagsOpen && (
              <div className="absolute top-full left-0 mt-2 bg-white dark:bg-slate-800 p-3 rounded-lg shadow-xl border dark:border-slate-700 z-10 w-64 max-h-60 overflow-y-auto">
                {allTags.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {allTags.map(tag => (
                      <label key={tag} className="flex items-center gap-2 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer">
                        <input type="checkbox" checked={selectedTags.includes(tag)} onChange={() => handleTagToggle(tag)} className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:checked:bg-indigo-500"/>
                        <span className="text-sm">{tag}</span>
                      </label>
                    ))}
                  </div>
                ) : <p className="text-sm text-slate-500">No tags found.</p>}
              </div>
            )}
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4">Search Results</h2>
        {searchTerm.length > 0 && (
            <p className="text-xs text-slate-500 mb-4 bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded border border-yellow-200 dark:border-yellow-800">
                Note: Text search only searches entries that have been viewed (decrypted) in this session. Tags and Moods search all entries.
            </p>
        )}
        
        {!hasActiveFilter ? (
          <div className="text-center py-16">
            <p className="text-slate-500 dark:text-slate-400">Use the search bar or filters above to find your entries.</p>
          </div>
        ) : filteredEntries.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEntries.map(entry => (
              <div key={entry.id} onClick={() => onSelectEntry(entry.id)} className="bg-white dark:bg-slate-800 p-5 rounded-lg shadow-sm hover:shadow-lg transition-shadow duration-300 cursor-pointer border border-slate-200 dark:border-slate-700 flex flex-col">
                <div className="flex justify-between items-start gap-3">
                  {entry.isDecrypted ? (
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 line-clamp-1">{entry.title}</h3>
                  ) : (
                    <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-3/4 animate-pulse"></div>
                  )}
                  {entry.mood && <span className="text-2xl" aria-label={`Mood: ${entry.mood}`}>{entry.mood}</span>}
                </div>
                <p 
                  className="text-xs text-slate-400 dark:text-slate-500 mt-1 mb-3"
                  title={new Date(entry.created_at).toLocaleString()}
                >
                  {formatTimestamp(entry.created_at)}
                </p>
                <div className="flex-grow">
                 {entry.isDecrypted ? (
                     <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-3">
                        {stripHtml(entry.content)}
                     </p>
                 ) : (
                     <div className="space-y-2 animate-pulse">
                        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
                        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-5/6"></div>
                     </div>
                 )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <h3 className="text-xl font-semibold text-slate-600 dark:text-slate-300">No Entries Found</h3>
            <p className="mt-2 text-slate-500 dark:text-slate-400">Try adjusting your search or filter criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchView;