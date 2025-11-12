import React from 'react';
import { DiaryEntry } from '../types';
import OnThisDay from './OnThisDay';

interface DiaryListProps {
  entries: DiaryEntry[];
  onSelectEntry: (id: string) => void;
  totalEntries: number;
  onThisDayEntries: DiaryEntry[];
}

const DiaryList: React.FC<DiaryListProps> = ({ entries, onSelectEntry, totalEntries, onThisDayEntries }) => {
  if (totalEntries === 0) {
    return (
      <div className="text-center py-20">
        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v11.494m-9-5.747h18" />
           <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h2 className="mt-4 text-2xl font-semibold text-slate-600">No entries yet</h2>
        <p className="mt-2 text-slate-500">Click "New Entry" to write your first diary post.</p>
      </div>
    );
  }

  const showNoResults = entries.length === 0 && totalEntries > 0;

  return (
    <div className="space-y-6">
      <OnThisDay entries={onThisDayEntries} onSelectEntry={onSelectEntry} />
      
      {showNoResults ? (
         <div className="text-center py-20">
          <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5h-6" />
          </svg>
          <h2 className="mt-4 text-2xl font-semibold text-slate-600">No Results Found</h2>
          <p className="mt-2 text-slate-500">Try adjusting your search terms or date range.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map(entry => (
            <div
              key={entry.id}
              onClick={() => onSelectEntry(entry.id)}
              className="bg-white p-6 rounded-lg shadow-sm hover:shadow-lg transition-shadow duration-300 cursor-pointer border border-slate-200 hover:border-indigo-300"
            >
              <div className="flex justify-between items-start">
                <h2 className="text-xl font-bold text-slate-800 mb-2">{entry.title}</h2>
                <span className="text-sm text-slate-500 whitespace-nowrap">
                  {new Date(entry.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
              <p className="text-slate-600 line-clamp-2">
                {entry.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DiaryList;