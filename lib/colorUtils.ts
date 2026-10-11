export interface MoodColor {
  bg: string;
  border: string;
}

// Helper to get a subtle background color based on the month (0-11)
export const getMonthColorClass = (monthIndex: number): string => {
  const colors = [
    'bg-blue-50/50 dark:bg-blue-900/10', // Jan
    'bg-purple-50/50 dark:bg-purple-900/10', // Feb
    'bg-emerald-50/50 dark:bg-emerald-900/10', // Mar
    'bg-rose-50/50 dark:bg-rose-900/10', // Apr
    'bg-amber-50/50 dark:bg-amber-900/10', // May
    'bg-cyan-50/50 dark:bg-cyan-900/10', // Jun
    'bg-fuchsia-50/50 dark:bg-fuchsia-900/10', // Jul
    'bg-orange-50/50 dark:bg-orange-900/10', // Aug
    'bg-teal-50/50 dark:bg-teal-900/10', // Sep
    'bg-pink-50/50 dark:bg-pink-900/10', // Oct
    'bg-indigo-50/50 dark:bg-indigo-900/10', // Nov
    'bg-sky-50/50 dark:bg-sky-900/10' // Dec
  ];
  return colors[monthIndex % 12];
};

export const getMonthBorderClass = (monthIndex: number): string => {
  const colors = [
    'border-blue-200 dark:border-blue-800',
    'border-purple-200 dark:border-purple-800',
    'border-emerald-200 dark:border-emerald-800',
    'border-rose-200 dark:border-rose-800',
    'border-amber-200 dark:border-amber-800',
    'border-cyan-200 dark:border-cyan-800',
    'border-fuchsia-200 dark:border-fuchsia-800',
    'border-orange-200 dark:border-orange-800',
    'border-teal-200 dark:border-teal-800',
    'border-pink-200 dark:border-pink-800',
    'border-indigo-200 dark:border-indigo-800',
    'border-sky-200 dark:border-sky-800'
  ];
  return colors[monthIndex % 12];
};

export const getMoodColorClass = (mood?: string | null, monthIndex?: number): MoodColor => {
  if (mood) {
    switch (mood) {
      case '🤣':
        return { bg: 'bg-orange-100 dark:bg-orange-900/40', border: 'border-orange-300 dark:border-orange-700' };
      case '😊': // Warm Yellow
        return { bg: 'bg-amber-100 dark:bg-amber-900/40', border: 'border-amber-300 dark:border-amber-700' };
      case '😢': // Gentle Blue
        return { bg: 'bg-blue-100 dark:bg-blue-900/40', border: 'border-blue-300 dark:border-blue-700' };
      case '😠': // Soft Coral / Red
        return { bg: 'bg-red-100 dark:bg-red-900/40', border: 'border-red-300 dark:border-red-700' };
      case '😎': // Aqua / Cyan
        return { bg: 'bg-cyan-100 dark:bg-cyan-900/40', border: 'border-cyan-300 dark:border-cyan-700' };
      case '🤔': // Light Indigo
        return { bg: 'bg-indigo-100 dark:bg-indigo-900/40', border: 'border-indigo-300 dark:border-indigo-700' };
      case '😍': // Soft Pink
        return { bg: 'bg-pink-100 dark:bg-pink-900/40', border: 'border-pink-300 dark:border-pink-700' };
      case '😴': // Lavender
        return { bg: 'bg-purple-100 dark:bg-purple-900/40', border: 'border-purple-300 dark:border-purple-700' };
      case '🥳': // Bright Mint
        return { bg: 'bg-emerald-100 dark:bg-emerald-900/40', border: 'border-emerald-300 dark:border-emerald-700' };
      default:
        break;
    }
  }

  // Fallback to month color, or default card colors if monthIndex is completely missing
  if (monthIndex !== undefined) {
    return {
      bg: getMonthColorClass(monthIndex),
      border: getMonthBorderClass(monthIndex)
    };
  }

  return {
    bg: 'bg-white/70 dark:bg-slate-800/70',
    border: 'border-slate-200 dark:border-slate-700'
  };
};
