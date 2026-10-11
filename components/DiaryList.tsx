import React, { useEffect, useRef, useMemo } from 'react';
import { DiaryEntry, Profile } from '../types';
import OnThisDay from './OnThisDay';
import { formatTimestamp } from '../lib/dateUtils';
import { Link } from 'react-router-dom';

interface DiaryListProps {
  entries: DiaryEntry[];
  onSelectEntry: (id: string) => void;
  onLoadContent: (id: string) => void;
  onThisDayEntries: DiaryEntry[];
  profile: Profile | null;
  filteredDate: Date | null;
  onClearFilter: () => void;
  timeFilter?: 'all' | 'week' | 'month' | 'year';
  onTimeFilterChange?: (filter: 'all' | 'week' | 'month' | 'year') => void;
}

// Sub-component to handle individual item visibility logic
import { getMoodColorClass } from '../lib/colorUtils';

const DiaryListItem: React.FC<{ 
    entry: DiaryEntry; 
    onLoadContent: (id: string) => void; 
    monthIndex?: number;
}> = ({ entry, onLoadContent, monthIndex }) => {
    const ref = useRef<HTMLAnchorElement>(null);
    const colors = getMoodColorClass(entry.mood, monthIndex);

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
        <div className="relative pl-8 sm:pl-12 py-4 group">
            {/* Timeline Dot */}
            <div className="absolute left-0 top-10 w-3 h-3 bg-indigo-400 dark:bg-indigo-500 rounded-full border-2 border-white dark:border-slate-900 transform -translate-x-1/2 z-10 group-hover:scale-125 group-hover:bg-indigo-600 dark:group-hover:bg-indigo-400 transition-transform duration-300 shadow-sm" />

            {/* Connection Line to card - optional, can just rely on spacing */}

            <Link
                ref={ref}
                to={`/app/entry/${entry.id}`}
                className={`block backdrop-blur-sm p-5 sm:p-6 rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer border hover:-translate-y-1 ${colors.bg} ${colors.border}`}
            >
                <div className="flex justify-between items-start gap-4">
                    <div className="flex flex-col gap-1">
                         {/* Journal Badge */}
                        <div className="flex items-center gap-1.5 mb-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v11.494m0-11.494M12 6.253a4.093 4.093 0 00-3.32 6.19l-2.06 2.06a1 1 0 001.42 1.42l2.06-2.06A4.094 4.094 0 0012 17.747m0 0a4.093 4.093 0 003.32-6.19l2.06-2.06a1 1 0 00-1.42-1.42l-2.06 2.06A4.094 4.094 0 0012 6.253z" /></svg>
                            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-500 dark:text-indigo-400">{entry.journal || 'Personal'}</span>
                        </div>

                        {entry.isDecrypted ? (
                            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors">{entry.title || 'Untitled'}</h2>
                        ) : (
                            <div className="h-7 bg-slate-200 dark:bg-slate-700 rounded w-48 animate-pulse" />
                        )}
                    </div>

                    <div className="text-right flex-shrink-0">
                        <span
                            className="text-sm font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md"
                            title={new Date(entry.created_at).toLocaleString()}
                        >
                            {formatTimestamp(entry.created_at)}
                        </span>
                        {entry.mood && <span className="text-2xl block mt-2" aria-label={`Mood: ${entry.mood}`}>{entry.mood}</span>}
                    </div>
                </div>

                {/* Tags rendered instantly as they are metadata */}
                {entry.tags && entry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                        {entry.tags.map(tag => (
                            <span key={tag} className="text-xs font-semibold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full dark:bg-indigo-900/40 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/50">
                                {tag}
                            </span>
                        ))}
                    </div>
                )}

                <div className="mt-4">
                    {entry.isDecrypted ? (
                        <p className="text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                            {stripHtml(entry.content)}
                        </p>
                    ) : (
                        <div className="space-y-2 animate-pulse mt-2">
                             <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full" />
                             <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6" />
                        </div>
                    )}
                </div>
            </Link>
        </div>
    );
};

const DiaryList: React.FC<DiaryListProps> = ({ entries, onSelectEntry, onLoadContent, onThisDayEntries, profile, filteredDate, onClearFilter, timeFilter = 'all', onTimeFilterChange }) => {

  // Group entries by Month and Year
  const groupedEntries = useMemo(() => {
    const groups: { [key: string]: DiaryEntry[] } = {};
    entries.forEach(entry => {
      const date = new Date(entry.created_at);
      const monthYear = date.toLocaleDateString('default', { month: 'long', year: 'numeric' });
      if (!groups[monthYear]) {
        groups[monthYear] = [];
      }
      groups[monthYear].push(entry);
    });
    return groups;
  }, [entries]);

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
        <div className="bg-indigo-50 dark:bg-slate-800 p-6 rounded-full mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16 text-indigo-400 dark:text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v11.494m-9-5.747h18" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-slate-700 dark:text-slate-200">
          Welcome to Diary, {profile?.full_name || 'friend'}!
        </h2>
        <p className="mt-3 text-lg text-slate-500 dark:text-slate-400 max-w-md">This is your private, encrypted space to reflect and record.</p>
        <p className="mt-6 text-slate-500 dark:text-slate-400 font-medium">Click <span className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-200 px-2 py-1 rounded">New Entry</span> to write your first post.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {filteredDate ? (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-slate-800/80 dark:to-indigo-900/20 p-5 rounded-xl border border-indigo-100 dark:border-indigo-800/50 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-100 dark:bg-indigo-900/50 p-2 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            </div>
            <h3 className="text-lg font-bold text-indigo-900 dark:text-indigo-100">
                {filteredDate.toLocaleDateString('default', { year: 'numeric', month: 'long', day: 'numeric' })}
            </h3>
          </div>
          <button 
            onClick={onClearFilter} 
            className="flex items-center gap-2 text-sm font-semibold bg-white dark:bg-slate-700 px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-sm border border-slate-200 dark:border-slate-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear Filter
          </button>
        </div>
      ) : (

        <>
            <OnThisDay entries={onThisDayEntries} onSelectEntry={onSelectEntry} />
            <div className="flex items-center gap-4 mb-2 mt-4">
                <div className="h-10 w-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white shadow-md">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                </div>
                <h2 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">Your Timeline, {profile?.full_name?.split(' ')[0] || 'friend'}</h2>
            </div>

            {/* Time Filter Pills */}
            {onTimeFilterChange && (
              <div className="flex flex-wrap gap-2 mt-4 mb-6">
                {(['all', 'week', 'month', 'year'] as const).map(filter => (
                  <button
                    key={filter}
                    onClick={() => onTimeFilterChange(filter)}
                    className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all shadow-sm ${
                      timeFilter === filter
                        ? 'bg-indigo-600 text-white dark:bg-indigo-500 hover:bg-indigo-700'
                        : 'bg-white text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {filter === 'all' ? 'All Time' : `This ${filter.charAt(0).toUpperCase() + filter.slice(1)}`}
                  </button>
                ))}
              </div>
            )}
        </>

      )}
      
      {/* TIMELINE CONTAINER */}
      <div className="relative pl-2 sm:pl-4 mt-8">
          {/* THE VERTICAL LINE */}
          <div className="absolute top-0 bottom-0 left-[7.5px] sm:left-[15.5px] w-[3px] bg-gradient-to-b from-indigo-200 via-indigo-100 to-transparent dark:from-indigo-800 dark:via-indigo-900/50 rounded-full" />

          {Object.entries(groupedEntries).map(([monthYear, monthEntries]) => (
              <div key={monthYear} className="mb-10 relative">
                  {/* Timeline Milestone Header */}
                  <div className="relative flex items-center mb-6 group z-10">
                      <div className="absolute left-0 w-4 h-4 bg-white dark:bg-slate-900 rounded-full border-4 border-indigo-500 dark:border-indigo-400 transform -translate-x-[6.5px] sm:-translate-x-[2.5px] shadow-sm z-20" />
                      <div className="pl-10 sm:pl-14">
                          <h3 className="text-sm font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded-full inline-block border border-indigo-100 dark:border-indigo-800/50">
                              {monthYear}
                          </h3>
                      </div>
                  </div>

                  {/* Entries for this month */}
                  <div className="space-y-4">
                      {monthEntries.map(entry => (
                          <DiaryListItem
                             key={entry.id}
                             entry={entry}
                             onLoadContent={onLoadContent}
                             monthIndex={new Date(entry.created_at).getMonth()}
                          />
                      ))}
                  </div>
              </div>
          ))}
      </div>
    </div>
  );
};

export default DiaryList;
