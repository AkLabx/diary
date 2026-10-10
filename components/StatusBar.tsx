import React from 'react';

interface StatusBarProps {
  wordCount: number;
  characterCount: number;
  saveStatus: 'synced' | 'encrypting' | 'error';
}

const StatusBar: React.FC<StatusBarProps> = ({ wordCount, characterCount, saveStatus }) => {
  const statusMap = {
    encrypting: { text: 'Encrypting...', classes: 'text-yellow-600 dark:text-yellow-400' },
    synced: { text: 'Synced', classes: 'text-green-600 dark:text-green-400' },
    error: { text: 'Save Error', classes: 'text-red-600 dark:text-red-400' },
  };

  return (
    <footer className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-sm border-t border-[#EAE1D6] dark:border-slate-800 h-10 flex-shrink-0">
      <div className="h-full flex items-center justify-between px-6 text-sm text-slate-500 dark:text-slate-400">
        <div>
          <span>{wordCount} words / {characterCount} characters</span>
        </div>
        <div className={`font-semibold ${statusMap[saveStatus].classes}`}>
          {statusMap[saveStatus].text}
        </div>
      </div>
    </footer>
  );
};

export default StatusBar;