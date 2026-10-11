// Helper to get a subtle background color based on the month (0-11)
export const getMonthColorClass = (monthIndex: number): string => {
  const colors = [
    'bg-blue-100/80 dark:bg-blue-900/40', // Jan
    'bg-purple-100/80 dark:bg-purple-900/40', // Feb
    'bg-emerald-100/80 dark:bg-emerald-900/40', // Mar
    'bg-rose-100/80 dark:bg-rose-900/40', // Apr
    'bg-amber-100/80 dark:bg-amber-900/40', // May
    'bg-cyan-100/80 dark:bg-cyan-900/40', // Jun
    'bg-fuchsia-100/80 dark:bg-fuchsia-900/40', // Jul
    'bg-orange-100/80 dark:bg-orange-900/40', // Aug
    'bg-teal-100/80 dark:bg-teal-900/40', // Sep
    'bg-pink-100/80 dark:bg-pink-900/40', // Oct
    'bg-indigo-100/80 dark:bg-indigo-900/40', // Nov
    'bg-sky-100/80 dark:bg-sky-900/40' // Dec
  ];
  return colors[monthIndex % 12];
};

export const getMonthBorderClass = (monthIndex: number): string => {
  const colors = [
    'border-blue-300 dark:border-blue-700 hover:border-blue-400 dark:hover:border-blue-500',
    'border-purple-300 dark:border-purple-700 hover:border-purple-400 dark:hover:border-purple-500',
    'border-emerald-300 dark:border-emerald-700 hover:border-emerald-400 dark:hover:border-emerald-500',
    'border-rose-300 dark:border-rose-700 hover:border-rose-400 dark:hover:border-rose-500',
    'border-amber-300 dark:border-amber-700 hover:border-amber-400 dark:hover:border-amber-500',
    'border-cyan-300 dark:border-cyan-700 hover:border-cyan-400 dark:hover:border-cyan-500',
    'border-fuchsia-300 dark:border-fuchsia-700 hover:border-fuchsia-400 dark:hover:border-fuchsia-500',
    'border-orange-300 dark:border-orange-700 hover:border-orange-400 dark:hover:border-orange-500',
    'border-teal-300 dark:border-teal-700 hover:border-teal-400 dark:hover:border-teal-500',
    'border-pink-300 dark:border-pink-700 hover:border-pink-400 dark:hover:border-pink-500',
    'border-indigo-300 dark:border-indigo-700 hover:border-indigo-400 dark:hover:border-indigo-500',
    'border-sky-300 dark:border-sky-700 hover:border-sky-400 dark:hover:border-sky-500'
  ];
  return colors[monthIndex % 12];
};


export const getMoodColorClass = (mood?: string): { bg: string, border: string } | null => {
  if (!mood) return null;

  const moodColors: Record<string, { bg: string, border: string }> = {
    '😊': { bg: 'bg-yellow-100/90 dark:bg-yellow-900/50', border: 'border-yellow-300 dark:border-yellow-700 hover:border-yellow-400 dark:hover:border-yellow-500' },
    '😢': { bg: 'bg-blue-100/90 dark:bg-blue-900/50', border: 'border-blue-300 dark:border-blue-700 hover:border-blue-400 dark:hover:border-blue-500' },
    '😠': { bg: 'bg-red-100/90 dark:bg-red-900/50', border: 'border-red-300 dark:border-red-700 hover:border-red-400 dark:hover:border-red-500' },
    '😎': { bg: 'bg-orange-100/90 dark:bg-orange-900/50', border: 'border-orange-300 dark:border-orange-700 hover:border-orange-400 dark:hover:border-orange-500' },
    '🤔': { bg: 'bg-violet-100/90 dark:bg-violet-900/50', border: 'border-violet-300 dark:border-violet-700 hover:border-violet-400 dark:hover:border-violet-500' },
    '😍': { bg: 'bg-pink-100/90 dark:bg-pink-900/50', border: 'border-pink-300 dark:border-pink-700 hover:border-pink-400 dark:hover:border-pink-500' },
    '😴': { bg: 'bg-slate-200/90 dark:bg-slate-800/60', border: 'border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500' },
    '🥳': { bg: 'bg-lime-100/90 dark:bg-lime-900/50', border: 'border-lime-300 dark:border-lime-700 hover:border-lime-400 dark:hover:border-lime-500' }
  };

  return moodColors[mood] || null;
};
