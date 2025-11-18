
import React from 'react';
import { ViewState } from '../types';

interface LeftSidebarProps {
  isVisible: boolean;
  onClose: () => void;
  activeView: ViewState;
  onChangeView: (view: ViewState) => void;
  onNewEntry: () => void;
}

const LeftSidebar: React.FC<LeftSidebarProps> = ({ isVisible, onClose, activeView, onChangeView, onNewEntry }) => {
  const navItems = [
    { view: 'timeline', label: 'Timeline', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg> },
    { view: 'calendar', label: 'Calendar', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> },
    { view: 'search', label: 'Search', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg> }
  ];

  return (
    <>
      {/* Backdrop for mobile: clicks here close the sidebar */}
      {isVisible && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 md:hidden" 
          onClick={onClose} 
          aria-hidden="true"
        />
      )}
      
      <aside className={`bg-[#F4EFE9] dark:bg-slate-900 border-r border-[#EAE1D6] dark:border-slate-800 flex flex-col transition-transform duration-300 ease-in-out w-64 fixed z-40 h-full ${isVisible ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between p-4 border-b border-[#EAE1D6] dark:border-slate-800">
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Diary</h1>
          <button onClick={onClose} className="p-2 rounded-md hover:bg-slate-200/50 dark:hover:bg-slate-700/50">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <button onClick={onNewEntry} className='w-full flex items-center gap-3 p-3 rounded-lg text-white font-semibold transition-colors bg-indigo-500 hover:bg-indigo-600'>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
            <span>New Entry</span>
          </button>
          <div className="pt-4">
            {navItems.map(item => (
              <button
                key={item.view}
                onClick={() => onChangeView(item.view as ViewState)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg text-left text-sm font-medium transition-colors ${
                  activeView === item.view 
                    ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </nav>
      </aside>
    </>
  );
};

export default LeftSidebar;
