import React from 'react';
import { NavLink } from 'react-router-dom';

interface LeftSidebarProps {
  isVisible: boolean;
  onClose: () => void;
  activeView: string;
  onChangeView: (view: string) => void;
  onNewEntry: () => void;
  journals: string[];
  activeJournal: string | null;
  onSelectJournal: (journal: string | null) => void;
}

const LeftSidebar: React.FC<LeftSidebarProps> = ({ 
    isVisible, 
    onClose, 
    // activeView, // Replaced by Router NavLink active state
    // onChangeView, // Handled by Router
    // onNewEntry, // Handled by Link or function
    journals,
    activeJournal,
    onSelectJournal
}) => {
  const navItems = [
    { path: '/app', end: true, label: 'Timeline', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg> },
    { path: '/app/calendar', label: 'Calendar', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> },
    { path: '/app/search', label: 'Search', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg> },
    { path: '/app/profile', label: 'Profile', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> }
  ];

  const handleLinkClick = () => {
    if (window.innerWidth < 768) {
      onClose();
    }
  };

  return (
    <aside className={`bg-[#F4EFE9] dark:bg-slate-900 border-r border-[#EAE1D6] dark:border-slate-800 flex flex-col transition-transform duration-300 ease-in-out w-64 fixed md:absolute md:top-0 md:left-0 z-30 h-full ${isVisible ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex items-center justify-between p-4 border-b border-[#EAE1D6] dark:border-slate-800">
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Diary</h1>
        <button onClick={onClose} className="p-2 rounded-md hover:bg-slate-200/50 dark:hover:bg-slate-700/50">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
      
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        <NavLink
            to="/app/new"
            onClick={handleLinkClick}
            className='w-full flex items-center gap-3 p-3 rounded-lg text-white font-semibold transition-colors bg-indigo-500 hover:bg-indigo-600 shadow-sm mb-6'
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
          <span>New Entry</span>
        </NavLink>
        
        <div>
            <h3 className="px-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Views</h3>
            {navItems.map(item => (
                <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.end}
                    onClick={handleLinkClick}
                    className={({ isActive }) => `w-full flex items-center gap-3 p-2.5 rounded-lg text-left text-sm font-medium transition-colors ${
                        isActive
                        ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800'
                    }`}
                >
                    {item.icon}
                    <span>{item.label}</span>
                </NavLink>
            ))}
        </div>

        <div className="pt-6">
            <h3 className="px-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Journals</span>
                <span className="bg-slate-200 dark:bg-slate-700 text-[10px] px-1.5 py-0.5 rounded-full text-slate-600 dark:text-slate-300">{journals.length}</span>
            </h3>
            <div className="space-y-1">
                <button
                    onClick={() => { onSelectJournal(null); handleLinkClick(); }}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-left text-sm font-medium transition-colors ${
                        activeJournal === null
                        ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800'
                    }`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 opacity-70" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                    </svg>
                    <span>All Entries</span>
                </button>
                
                {journals.map(journal => (
                     <button
                        key={journal}
                        onClick={() => { onSelectJournal(journal); handleLinkClick(); }}
                        className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-left text-sm font-medium transition-colors ${
                            activeJournal === journal
                            ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800'
                        }`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 opacity-70" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                        </svg>
                        <span className="truncate">{journal}</span>
                    </button>
                ))}
            </div>
        </div>
      </nav>
    </aside>
  );
};

export default LeftSidebar;