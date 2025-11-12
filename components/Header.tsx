import React, { useState, useRef, useEffect } from 'react';
import { ViewState, Profile } from '../types';
import { Session } from '@supabase/supabase-js';
import ProfilePanel from './ProfilePanel';

interface HeaderProps {
  session: Session;
  profile: Profile | null;
  onNewEntry: () => void;
  onGoHome: () => void;
  currentView: ViewState['view'];
  onToggleView: () => void;
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  startDate: string;
  onStartDateChange: (date: string) => void;
  endDate: string;
  onEndDateChange: (date: string) => void;
  onSignOut: () => void;
  onUpdateProfile: (updates: { full_name?: string; avatar_url?: string; }) => Promise<void>;
  onAvatarUpload: (file: File) => Promise<void>;
  theme: string;
  onToggleTheme: () => void;
}

const Header: React.FC<HeaderProps> = (props) => {
  const { 
    session,
    profile,
    onNewEntry, 
    onGoHome, 
    currentView,
    onToggleView,
    searchTerm,
    onSearchTermChange,
    startDate,
    onStartDateChange,
    endDate,
    onEndDateChange,
  } = props;
  
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const showSearch = currentView === 'list';

  return (
    <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shadow-md dark:shadow-none border-b border-transparent dark:border-slate-800 sticky top-0 z-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-4 flex justify-between items-center flex-wrap gap-4">
        <div 
          className="flex items-center gap-3 cursor-pointer group"
          onClick={onGoHome}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-500 group-hover:text-indigo-600 transition-colors" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
          </svg>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
            Diary
          </h1>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end grow sm:grow-0">
          {showSearch && (
            <>
              <div className="relative">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
                <input
                  type="search"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => onSearchTermChange(e.target.value)}
                  className="pl-8 pr-2 py-1.5 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm w-32 sm:w-40 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:placeholder-slate-500"
                  aria-label="Search diary entries"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <input 
                  type="date"
                  value={startDate}
                  onChange={(e) => onStartDateChange(e.target.value)}
                  className="border border-slate-300 rounded-md px-2 py-1.5 text-sm text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:[color-scheme:dark]"
                  aria-label="Start date for search"
                />
                <span className="text-slate-500 dark:text-slate-400 text-sm">to</span>
                <input 
                  type="date"
                  value={endDate}
                  onChange={(e) => onEndDateChange(e.target.value)}
                  className="border border-slate-300 rounded-md px-2 py-1.5 text-sm text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:[color-scheme:dark]"
                  aria-label="End date for search"
                />
              </div>
            </>
          )}

          {(currentView === 'list' || currentView === 'calendar') && (
            <button
              onClick={onToggleView}
              className="p-2 rounded-md hover:bg-slate-100 text-slate-500 hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:hover:bg-slate-800 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors"
              aria-label={currentView === 'list' ? 'Switch to Calendar View' : 'Switch to List View'}
            >
              {currentView === 'list' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              )}
            </button>
          )}
        
          <button
            onClick={onNewEntry}
            className="flex items-center gap-2 bg-indigo-500 text-white font-semibold px-4 py-2 rounded-lg shadow-sm hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 ease-in-out transform hover:scale-105"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            <span className="hidden sm:inline">New Entry</span>
          </button>
          
          <div className="relative" ref={profileMenuRef}>
            <button 
              onClick={() => setIsProfileOpen(prev => !prev)}
              className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              aria-expanded={isProfileOpen}
              aria-haspopup="true"
              aria-label="Open profile menu"
            >
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="User avatar" className="w-full h-full object-cover" />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full text-slate-500 dark:text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              )}
            </button>
            {isProfileOpen && (
              <ProfilePanel 
                onClose={() => setIsProfileOpen(false)}
                {...props}
              />
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
