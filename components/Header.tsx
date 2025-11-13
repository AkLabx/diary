import React, { useState, useRef, useEffect } from 'react';
import { ViewState, Profile, DiaryEntry } from '../types';
// Fix: Use 'import type' for Session to resolve potential module resolution issues with older Supabase versions.
import type { Session } from '@supabase/supabase-js';
import ProfilePanel from './ProfilePanel';

interface HeaderProps {
  session: Session;
  profile: Profile | null;
  entries: DiaryEntry[];
  onNewEntry: () => void;
  onGoHome: () => void;
  onGoToSearch: () => void;
  currentView: ViewState['view'];
  onToggleView: () => void;
  onSignOut: () => void;
  onUpdateProfile: (updates: { full_name?: string; avatar_url?: string; }) => Promise<void>;
  onAvatarUpload: (file: File) => Promise<void>;
  onOpenExportModal: () => void;
  theme: string;
  onToggleTheme: () => void;
}

const Header: React.FC<HeaderProps> = (props) => {
  const { 
    profile,
    entries,
    onNewEntry, 
    onGoHome, 
    onGoToSearch,
    currentView,
    onToggleView,
    onOpenExportModal,
  } = props;
  
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Fix: Corrected a typo where `profileMenu` was used instead of `profileMenuRef`.
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const showControls = currentView === 'list' || currentView === 'calendar' || currentView === 'search';

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
            {currentView === 'search' ? 'Homepage' : 'Diary'}
          </h1>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-end grow sm:grow-0">
          
          {showControls && (
            <>
              <button
                onClick={onGoToSearch}
                className="p-2 rounded-md hover:bg-slate-100 text-slate-500 hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:hover:bg-slate-800 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors"
                aria-label="Search entries"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>

              <button
                onClick={onToggleView}
                className="p-2 rounded-md hover:bg-slate-100 text-slate-500 hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:hover:bg-slate-800 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors"
                aria-label={currentView === 'calendar' ? 'Switch to List View' : 'Switch to Calendar View'}
              >
                {currentView !== 'calendar' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                )}
              </button>
            </>
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
                // This is a hacky way to pass all props, but it works for this case.
                // A better approach might involve a context provider for some of these props.
                session={props.session}
                profile={props.profile}
                entries={entries}
                onSignOut={props.onSignOut}
                onUpdateProfile={props.onUpdateProfile}
                onAvatarUpload={props.onAvatarUpload}
                onOpenExportModal={onOpenExportModal}
                theme={props.theme}
                onToggleTheme={props.onToggleTheme}
              />
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;