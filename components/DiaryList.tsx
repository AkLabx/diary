import React, { useEffect, useRef } from 'react';
import { DiaryEntry, Profile } from '../types';
import OnThisDay from './OnThisDay';
import { formatTimestamp } from '../lib/dateUtils';

interface DiaryListProps {
  entries: DiaryEntry[];
  onSelectEntry: (id: string) => void;
  onLoadContent: (id: string) => void;
  onThisDayEntries: DiaryEntry[];
  profile: Profile | null;
  filteredDate: Date | null;
  onClearFilter: () => void;
}

// Sub-component to handle individual item visibility logic
const DiaryListItem: React.FC<{ 
    entry: DiaryEntry; 
    onSelect: () => void; 
    onLoadContent: (id: string) => void; 
}> = ({ entry, onSelect, onLoadContent }) => {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // If already decrypted or currently loading, we don't need to observe
        if (entry.isDecrypted || entry.isLoading) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    onLoadContent(entry.id);
                    observer.disconnect();
                }
            },
            { rootMargin: '100px' } // Start loading slightly before it comes into view
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => observer.disconnect();
    }, [entry.id, entry.isDecrypted, entry.isLoading, onLoadContent]);

    const stripHtml = (html: string) => {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        return doc.body.textContent || "";
    };

    return (
        <div
            ref={ref}
            onClick={onSelect}
            className="bg-white/50 dark:bg-slate-800/50 p-6 rounded-lg shadow-sm hover:shadow-lg transition-shadow duration-300 cursor-pointer border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600"
        >
            <div className="flex justify-between items-start gap-4">
                {entry.isDecrypted ? (
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{entry.title || 'Untitled'}</h2>
                ) : (
                    <div className="h-7 bg-slate-200 dark:bg-slate-700 rounded w-2/3 animate-pulse" />
                )}
                <div className="text-right flex-shrink-0">
                    <span 
                        className="text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap"
                        title={new Date(entry.created_at).toLocaleString()}
                    >
                        {formatTimestamp(entry.created_at)}
                    </span>
                    {entry.mood && <span className="text-lg block mt-1" aria-label={`Mood: ${entry.mood}`}>{entry.mood}</span>}
                </div>
            </div>
            
            {/* Tags rendered instantly as they are metadata */}
            {entry.tags && entry.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                    {entry.tags.map(tag => (
                        <span key={tag} className="text-xs font-medium bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full dark:bg-indigo-900/50 dark:text-indigo-300">
                            {tag}
                        </span>
                    ))}
                </div>
            )}

            <div className="mt-3">
                {entry.isDecrypted ? (
                    <p className="text-slate-600 dark:text-slate-300 line-clamp-2">
                        {stripHtml(entry.content)}
                    </p>
                ) : (
                    <div className="space-y-2 animate-pulse mt-2">
                         <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full" />
                         <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6" />
                    </div>
                )}
            </div>
        </div>
    );
};

const DiaryList: React.FC<DiaryListProps> = ({ entries, onSelectEntry, onLoadContent, onThisDayEntries, profile, filteredDate, onClearFilter }) => {
  if (entries.length === 0) {
    if (filteredDate) {
       return (
        <div className="text-center py-20 flex flex-col items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-20 w-20 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9m12 4h-4m-4-4h-4" />
          </svg>
          <h2 className="mt-6 text-2xl font-bold text-slate-700 dark:text-slate-200">
            No entries found for {filteredDate.toLocaleDateString('default', { month: 'long', day: 'numeric', year: 'numeric' })}.
          </h2>
          <button 
            onClick={onClearFilter} 
            className="mt-4 text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
          >
            Show All Entries
          </button>
        </div>
      );
    }
    return (
      <div className="text-center py-20 flex flex-col items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-20 w-20 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v11.494m-9-5.747h18" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h2 className="mt-6 text-3xl font-bold text-slate-700 dark:text-slate-200">
          Welcome to Diary, {profile?.full_name || 'friend'}!
        </h2>
        <p className="mt-2 text-slate-500 dark:text-slate-400">This is your private, encrypted space to reflect and record.</p>
        <p className="mt-4 text-slate-500 dark:text-slate-400">Click "New Entry" to write your first post.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {filteredDate ? (
        <div className="bg-indigo-50 dark:bg-slate-800/50 p-4 rounded-lg border border-indigo-200 dark:border-slate-700 flex justify-between items-center">
          <h3 className="text-lg font-bold text-indigo-800 dark:text-indigo-300">
            Showing entries for {filteredDate.toLocaleDateString('default', { year: 'numeric', month: 'long', day: 'numeric' })}
          </h3>
          <button 
            onClick={onClearFilter} 
            className="flex items-center gap-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Show All
          </button>
        </div>
      ) : (
        <OnThisDay entries={onThisDayEntries} onSelectEntry={onSelectEntry} />
      )}
      
      {!filteredDate && <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Welcome back, {profile?.full_name || 'friend'}!</h2>}
      <div className="space-y-4">
        {entries.map(entry => (
          <DiaryListItem 
             key={entry.id} 
             entry={entry} 
             onSelect={() => onSelectEntry(entry.id)}
             onLoadContent={onLoadContent}
          />
        ))}
      </div>
    </div>
  );
};

export default DiaryList;