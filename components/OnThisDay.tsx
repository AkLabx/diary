import React from 'react';
import { DiaryEntry } from '../types';

interface OnThisDayProps {
  entries: DiaryEntry[];
  onSelectEntry: (id: string) => void;
}

const OnThisDay: React.FC<OnThisDayProps> = ({ entries, onSelectEntry }) => {
  if (entries.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-slate-800/50 dark:to-slate-800/50 p-6 rounded-lg border border-indigo-200 dark:border-slate-700 shadow-sm">
      <h3 className="text-lg font-bold text-indigo-800 dark:text-indigo-300 mb-4 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l-3-3m0 0l3-3m-3 3h9" />
        </svg>
        On This Day...
      </h3>
      <div className="space-y-3">
        {entries.map(entry => {
          // Fix: Property 'date' does not exist on type 'DiaryEntry'. Changed to 'created_at'.
          const year = new Date(entry.created_at).getFullYear();
          const yearsAgo = new Date().getFullYear() - year;
          return (
            <div
              key={entry.id}
              onClick={() => onSelectEntry(entry.id)}
              className="bg-white/60 dark:bg-slate-700/50 p-3 rounded-md cursor-pointer hover:bg-white dark:hover:bg-slate-700 transition-colors flex justify-between items-center"
            >
              <div>
                <p className="font-semibold text-slate-700 dark:text-slate-200">{entry.title}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{yearsAgo} year{yearsAgo > 1 ? 's' : ''} ago</p>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OnThisDay;