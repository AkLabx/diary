import React from 'react';

interface HamburgerMenuProps {
  onClick: () => void;
}

const HamburgerMenu: React.FC<HamburgerMenuProps> = ({ onClick }) => {
  return (
    <button 
      onClick={onClick} 
      className="fixed top-[calc(0.75rem+env(safe-area-inset-top,0px))] left-3 sm:left-4 z-40 p-2 rounded-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-md shadow-sm border border-slate-200/50 dark:border-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
      aria-label="Open navigation menu"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-600 dark:text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>
  );
};

export default HamburgerMenu;
