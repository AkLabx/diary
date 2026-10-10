import React from 'react';

interface HamburgerMenuProps {
  onClick: () => void;
}

const HamburgerMenu: React.FC<HamburgerMenuProps> = ({ onClick }) => {
  return (
    <button 
      onClick={onClick} 
      className="fixed top-3 left-4 z-40 p-2 rounded-md bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
      aria-label="Open navigation menu"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-600 dark:text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>
  );
};

export default HamburgerMenu;