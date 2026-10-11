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
    'hover:border-blue-300 dark:hover:border-blue-700',
    'hover:border-purple-300 dark:hover:border-purple-700',
    'hover:border-emerald-300 dark:hover:border-emerald-700',
    'hover:border-rose-300 dark:hover:border-rose-700',
    'hover:border-amber-300 dark:hover:border-amber-700',
    'hover:border-cyan-300 dark:hover:border-cyan-700',
    'hover:border-fuchsia-300 dark:hover:border-fuchsia-700',
    'hover:border-orange-300 dark:hover:border-orange-700',
    'hover:border-teal-300 dark:hover:border-teal-700',
    'hover:border-pink-300 dark:hover:border-pink-700',
    'hover:border-indigo-300 dark:hover:border-indigo-700',
    'hover:border-sky-300 dark:hover:border-sky-700'
  ];
  return colors[monthIndex % 12];
};
