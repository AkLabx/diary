import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Weather, Profile } from '../types';
import { format } from 'date-fns';
import { supabase } from '../lib/supabaseClient';
import { useCrypto } from '../contexts/CryptoContext';
import { usePersonalTasks } from '../contexts/TaskContext';
import { WeatherModal } from './WeatherModal';
import { getWeatherConditionEmoji } from '../lib/weather';

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
  onOpenSidebar?: () => void;
  isWeatherLoading?: boolean;
  onRefreshWeather?: () => Promise<void> | void;
  onSetCustomCity?: (city: string) => Promise<boolean>;
  onUseGPSLocation?: () => Promise<void> | void;
}

const SaveStatusIndicator: React.FC<{ status: TopBarProps['saveStatus'] }> = ({ status }) => {
    const statusMap = {
        encrypting: { text: 'Encrypting...', icon: <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg> },
        synced: { text: 'Synced', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg> },
        error: { text: 'Error', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg> },
    };
    const { text, icon } = statusMap[status];
    return <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
        {icon}
        <span className="hidden sm:inline">{text}</span>
    </div>;
};

const TopBar: React.FC<TopBarProps> = ({ 
  isEditing, 
  onSave, 
  onCancel, 
  currentDate, 
  weather, 
  theme, 
  onToggleTheme, 
  saveStatus, 
  profile, 
  onShowProfile, 
  isToolsPanelVisible, 
  onToggleToolsPanel, 
  isLeftSidebarVisible, 
  onOpenSidebar,
  isWeatherLoading = false,
  onRefreshWeather,
  onSetCustomCity,
  onUseGPSLocation
}) => {
  const navigate = useNavigate();
  const { todayTasks, carriedForwardTasks } = usePersonalTasks();
  const activeTasksCount = todayTasks.length + carriedForwardTasks.length;

  const [currentTime, setCurrentTime] = useState(new Date());
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null);
  const [isWeatherModalOpen, setIsWeatherModalOpen] = useState(false);
  const { lock } = useCrypto();

  useEffect(() => {
    const timerId = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timerId);
  }, []);

  useEffect(() => {
      let isMounted = true;
      const resolveAvatar = async () => {
          if (!profile?.avatar_url) {
              if (isMounted) setAvatarSrc(null);
              return;
          }
          
          if (profile.avatar_url.startsWith('http')) {
              if (isMounted) setAvatarSrc(profile.avatar_url);
          } else {
              try {
                  const { data, error } = await supabase.storage
                      .from('avatars')
                      .createSignedUrl(profile.avatar_url, 3600);
                  
                  if (error) throw error;

                  if (isMounted && data?.signedUrl) {
                      setAvatarSrc(data.signedUrl);
                  }
              } catch (e) {
                  console.error("Error resolving avatar URL in TopBar:", e);
                  if (isMounted) setAvatarSrc(null);
              }
          }
      };
      resolveAvatar();
      return () => { isMounted = false; };
  }, [profile?.avatar_url]);

  return (
    <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-[#EAE1D6] dark:border-slate-800 pt-[env(safe-area-inset-top,0px)] flex-shrink-0 relative z-20 transition-all duration-200">
      <div className="h-14 sm:h-16 flex items-center justify-between px-3 sm:px-6 gap-2">
        
        {/* Left Section: Hamburger Button + Date/Time/Weather */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {!isLeftSidebarVisible && onOpenSidebar && (
            <button
              onClick={onOpenSidebar}
              aria-label="Open navigation menu"
              className="p-2 -ml-1 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/50 flex-shrink-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}

          {/* Date, Time & Weather */}
          <div className={`items-center gap-1.5 sm:gap-2.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 min-w-0 ${isEditing ? 'hidden md:flex' : 'flex'}`}>
            <span className="font-semibold whitespace-nowrap">{format(currentTime, 'p')}</span>
            <span className="font-medium whitespace-nowrap hidden sm:inline">{format(currentDate, 'MMMM d, yyyy')}</span>
            <span className="font-medium whitespace-nowrap sm:hidden">{format(currentDate, 'MMM d')}</span>

            {/* Weather / Location Badge */}
            {weather ? (
              <button
                type="button"
                onClick={() => setIsWeatherModalOpen(true)}
                title={`${weather.location}: ${Math.round(weather.temp)}°C, ${weather.description || 'Clear'}. Click for details.`}
                className="flex items-center gap-1 sm:gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 hover:bg-amber-500/20 dark:bg-amber-400/10 dark:hover:bg-amber-400/20 text-amber-900 dark:text-amber-200 transition-all text-xs border border-amber-500/20 active:scale-95 max-w-[130px] sm:max-w-[200px]"
              >
                <span className="text-xs select-none" role="img" aria-label="weather-icon">
                  {getWeatherConditionEmoji(weather.icon, weather.description)}
                </span>
                <span className="truncate font-medium text-[11px] sm:text-xs">
                  <span className="hidden xs:inline sm:inline">{weather.location}, </span>
                  {Math.round(weather.temp)}°C
                </span>
              </button>
            ) : isWeatherLoading ? (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100/70 dark:bg-slate-800/70 text-slate-400 text-xs animate-pulse border border-slate-200/50 dark:border-slate-700/50">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-ping"></span>
                <span className="text-[11px] hidden sm:inline">Weather...</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsWeatherModalOpen(true)}
                title="Click to enable location or set your city"
                className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 text-xs font-medium transition-all border border-indigo-200/60 dark:border-indigo-800/60 active:scale-95"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-[11px] sm:text-xs">
                  <span className="hidden sm:inline">Set </span>Location
                </span>
              </button>
            )}

            {/* Quick Task Status Pill (Visible when not editing) */}
            {!isEditing && (
              <button
                type="button"
                onClick={() => navigate('/app/tasks')}
                title="View Today's Tasks"
                className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border transition-all cursor-pointer bg-white/70 hover:bg-white dark:bg-slate-800/70 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 shadow-2xs hover:border-indigo-300 dark:hover:border-indigo-700"
              >
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓</span>
                <span>{activeTasksCount > 0 ? `${activeTasksCount} Pending` : 'All Done'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Center/Action Section: Save/Cancel when editing */}
        {isEditing && (
          <div className="flex items-center gap-2 sm:gap-3">
            <SaveStatusIndicator status={saveStatus} />
            <button 
              onClick={onCancel} 
              className="px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={onSave} 
              className="px-4 py-1.5 text-xs sm:text-sm font-semibold text-white bg-indigo-500 rounded-lg hover:bg-indigo-600 transition-colors shadow-sm"
            >
              Save
            </button>
          </div>
        )}

        {/* Right Section: Search / Tools / Theme / Lock / Profile */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          {/* Quick Search Shortcut */}
          {!isEditing && (
            <button
              type="button"
              onClick={() => navigate('/app/search')}
              title="Search Diary & Tasks"
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          )}

          {isEditing && (
            <button 
              onClick={onToggleToolsPanel} 
              title="Toggle Tools Panel" 
              className={`p-2 rounded-lg transition-colors ${isToolsPanelVisible ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
            </button>
          )}
          
          <button 
            onClick={lock} 
            title="Lock Diary" 
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
          </button>

          <button 
            onClick={onToggleTheme} 
            title="Toggle Theme" 
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
          >
            {theme === 'dark' ? 
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" /></svg> :
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 14.464A1 1 0 106.465 13.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zm-1.414-2.12a1 1 0 011.414 0l.707.707a1 1 0 11-1.414 1.414l-.707-.707a1 1 0 010-1.414zM4 11a1 1 0 100-2H3a1 1 0 100 2h1z" clipRule="evenodd" /></svg>
            }
          </button>
          
          <button 
            onClick={onShowProfile} 
            title="Profile & Settings" 
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex items-center justify-center hover:ring-2 ring-indigo-500 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 transition-all flex-shrink-0"
          >
            {avatarSrc ? (
              <img src={avatarSrc} alt="User avatar" className="w-full h-full object-cover" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 text-slate-500 dark:text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Interactive Weather & Location Management Modal */}
      <WeatherModal
        isOpen={isWeatherModalOpen}
        onClose={() => setIsWeatherModalOpen(false)}
        weather={weather}
        isLoading={Boolean(isWeatherLoading)}
        onRefresh={onRefreshWeather || (() => {})}
        onSetCustomCity={onSetCustomCity || (async () => false)}
        onUseGPSLocation={onUseGPSLocation || (() => {})}
      />
    </header>
  );
};

export default TopBar;
