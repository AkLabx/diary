import React from 'react';
import { DiaryEntry, Profile } from '../types';
import OnThisDay from './OnThisDay';

interface DiaryListProps {
  entries: DiaryEntry[];
  onSelectEntry: (id: string) => void;
  totalEntries: number;
  onThisDayEntries: DiaryEntry[];
  profile: Profile | null;
  isFiltered: boolean;
}

const DiaryList: React.FC<DiaryListProps> = ({ entries, onSelectEntry, totalEntries, onThisDayEntries, profile, isFiltered }) => {
  const stripHtml = (html: string) => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || "";
  };

  const welcomeName = profile?.full_name;
  const welcomeMessage = welcomeName ? `Welcome to Diary, ${welcomeName}!` : 'Welcome to Diary!';

  const showNoResults = entries.length === 0 && totalEntries > 0;

  return (
    <div className="space-y-6">
      {!isFiltered && (
        <div>
          <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-200">{welcomeMessage}</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">This is your private, encrypted space to reflect and record.</p>
        </div>
      )}

      {totalEntries === 0 ? (
        <div className="text-center py-20">
          <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v11.494m-9-5.747h18" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h2 className="mt-4 text-2xl font-semibold text-slate-600 dark:text-slate-300">No entries yet</h2>
          <p className="mt-2 text-slate-500 dark:text-slate-400">Click "New Entry" to write your first diary post.</p>
        </div>
      ) : (
        <>
          <OnThisDay entries={onThisDayEntries} onSelectEntry={onSelectEntry} />
      
          {showNoResults ? (
            <div className="text-center py-20">
              <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5h-6" />
              </svg>
              <h2 className="mt-4 text-2xl font-semibold text-slate-600 dark:text-slate-300">No Results Found</h2>
              <p className="mt-2 text-slate-500 dark:text-slate-400">Try adjusting your search terms or date range.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {entries.map(entry => (
                <div
                  key={entry.id}
                  onClick={() => onSelectEntry(entry.id)}
                  className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm hover:shadow-lg transition-shadow duration-300 cursor-pointer border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600"
                >
                  <div className="flex justify-between items-start gap-4">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{entry.title}</h2>
                    <div className="text-right">
                      <span className="text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {new Date(entry.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                      {entry.mood && <span className="text-lg block mt-1" aria-label={`Mood: ${entry.mood}`}>{entry.mood}</span>}
                    </div>
                  </div>
                  {entry.tags && entry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {entry.tags.map(tag => (
                        <span key={tag} className="text-xs font-medium bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full dark:bg-indigo-900/50 dark:text-indigo-300">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="text-slate-600 dark:text-slate-300 line-clamp-2 mt-3">
                    {stripHtml(entry.content)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DiaryList;