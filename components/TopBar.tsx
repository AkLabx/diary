import React, { useState, useEffect } from 'react';
import { Weather, Profile } from '../types';
import { format } from 'date-fns';

interface TopBarProps {
  isEditing: boolean;
  onSave: () => void;
  onCancel: () => void;
  currentDate: Date;
  weather: Weather | null;
  theme: string;
  onToggleTheme: () => void;
  saveStatus: 'synced' | 'encrypting' | 'error';
  profile: Profile | null;
  onShowProfile: () => void;
  isToolsPanelVisible: boolean;
  onToggleToolsPanel: () => void;
  isLeftSidebarVisible: boolean;
}

const SaveStatusIndicator: React.FC<{ status: TopBarProps['saveStatus'] }> = ({ status }) => {
    const statusMap = {
        encrypting: { text: 'Encrypting...', icon: <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg> },
        synced: { text: 'Synced', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg> },
        error: { text: 'Error', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg> },
    };
    const { text, icon } = statusMap[status];
    return <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        {icon}
        <span>{text}</span>
    </div>;
};


const TopBar: React.FC<TopBarProps> = ({ isEditing, onSave, onCancel, currentDate, weather, theme, onToggleTheme, saveStatus, profile, onShowProfile, isToolsPanelVisible, onToggleToolsPanel, isLeftSidebarVisible }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timerId = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timerId);
  }, []);

  return (
    <header className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-sm border-b border-[#EAE1D6] dark:border-slate-800 h-16 flex-shrink-0 relative z-20">
      <div className="h-full flex items-center justify-between px-6">
        <div className={`flex items-center gap-4 text-sm text-slate-600 dark:text-slate-300 transition-all duration-300 ${!isLeftSidebarVisible ? 'pl-16' : ''}`}>
          <span className="font-semibold">{format(currentTime, 'p')}</span>
          <span className="font-semibold">{format(currentDate, 'MMMM d, yyyy')}</span>
          {weather && (
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-orange-500 rounded-full"></span>
              <span>{weather.location}, {Math.round(weather.temp)}°C</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
            {isEditing ? (
                 <>
                    <SaveStatusIndicator status={saveStatus} />
                    <button onClick={onCancel} className="px-4 py-1.5 text-sm font-semibold rounded-md hover:bg-slate-100 dark:hover:bg-slate-700">Cancel</button>
                    <button onClick={onSave} className="px-4 py-1.5 text-sm font-semibold text-white bg-indigo-500 rounded-md hover:bg-indigo-600">Save</button>
                 </>
            ) : (
                <div className="h-9"></div> // Placeholder to maintain height
            )}
        </div>

        <div className="flex items-center gap-4">
           {isEditing && (
             <button onClick={onToggleToolsPanel} title="Toggle Tools Panel" className={`p-2 rounded-full transition-colors ${isToolsPanelVisible ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600' : 'hover:bg-slate-200/50 dark:hover:bg-slate-700/50 text-slate-500'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></svg>
             </button>
           )}
           <button onClick={onToggleTheme} title="Toggle Theme" className="p-2 rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-700/50 text-slate-500 dark:text-slate-400">
             {theme === 'dark' ? 
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" /></svg> :
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 14.464A1 1 0 106.465 13.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zm-1.414-2.12a1 1 0 011.414 0l.707.707a1 1 0 11-1.414 1.414l-.707-.707a1 1 0 010-1.414zM4 11a1 1 0 100-2H3a1 1 0 100 2h1z" clipRule="evenodd" /></svg>
             }
           </button>
           <button onClick={onShowProfile} title="Profile & Settings" className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex items-center justify-center hover:ring-2 ring-indigo-500 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 transition-all">
                {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="User avatar" className="w-full h-full object-cover" />
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-500 dark:text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                )}
            </button>
        </div>
      </div>
    </header>
  );
};

export default TopBar;