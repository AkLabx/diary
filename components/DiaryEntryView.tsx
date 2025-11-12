

import React from 'react';
import { DiaryEntry } from '../types';

interface DiaryEntryViewProps {
  entry: DiaryEntry;
  onEdit: () => void;
  onDelete: () => void;
}

const DiaryEntryView: React.FC<DiaryEntryViewProps> = ({ entry, onEdit, onDelete }) => {
  return (
    <div className="bg-white p-6 sm:p-8 rounded-lg shadow-md border border-slate-200 animate-fade-in">
      <div className="border-b border-slate-200 pb-4 mb-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
          <h1 className="text-3xl font-bold text-slate-900">{entry.title}</h1>
          <p className="text-sm text-slate-500">
            {new Date(entry.created_at).toLocaleString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit'
            })}
          </p>
        </div>
      </div>
      
      <div className="prose prose-slate max-w-none whitespace-pre-wrap break-words my-6">
        {entry.content}
      </div>

      <div className="border-t border-slate-200 pt-4 mt-6 flex justify-end gap-3">
        <button
          onClick={onEdit}
          className="flex items-center gap-2 bg-slate-100 text-slate-700 font-semibold px-4 py-2 rounded-lg hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
        >
           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
            <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
          </svg>
          Edit
        </button>
        <button
          onClick={onDelete}
          className="flex items-center gap-2 bg-red-500 text-white font-semibold px-4 py-2 rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          Delete
        </button>
      </div>
    </div>
  );
};

export default DiaryEntryView;