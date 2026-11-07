export interface CategoryMeta {
  code: number;
  label: string;
  icon: string;
  colorClass: string;
}

export const DEFAULT_TASK_CATEGORIES: Record<number, CategoryMeta> = {
  0: { code: 0, label: 'Habits', icon: '🌿', colorClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800' },
  1: { code: 1, label: 'Personal', icon: '🧘', colorClass: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800' },
  2: { code: 2, label: 'Health', icon: '💊', colorClass: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800' },
  3: { code: 3, label: 'Family', icon: '💖', colorClass: 'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950/40 dark:text-pink-300 dark:border-pink-800' },
  4: { code: 4, label: 'Work & Study', icon: '🎯', colorClass: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800' },
  5: { code: 5, label: 'Money & Bills', icon: '📜', colorClass: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800' },
};

export const ENERGY_LEVELS = [
  { value: 1, label: 'Low Effort', icon: '☕', hint: 'Quick, easy to do' },
  { value: 2, label: 'Medium Effort', icon: '⚡', hint: 'Takes some time & focus' },
  { value: 3, label: 'High Effort', icon: '🔥', hint: 'Requires deep focus' },
] as const;

export const IMPORTANCE_LEVELS = [
  { value: 1, label: 'Normal', icon: '🌱', hint: 'Regular to-do' },
  { value: 2, label: 'Important', icon: '⭐', hint: 'High priority' },
  { value: 3, label: 'Urgent', icon: '🔥', hint: 'Needs immediate attention' },
] as const;

export function getCategoryMeta(code: number): CategoryMeta {
  return DEFAULT_TASK_CATEGORIES[code] || DEFAULT_TASK_CATEGORIES[0];
}

/**
 * Natural language relative date formatting for everyday tasks
 */
export function formatTaskDueDate(dateString: string | null | undefined): { text: string; isOverdue: boolean; isToday: boolean } {
  if (!dateString) return { text: 'Anytime', isOverdue: false, isToday: false };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [y, m, d] = dateString.split('-').map(Number);
  const target = new Date(y, m - 1, d);
  target.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return { text: 'Today', isOverdue: false, isToday: true };
  if (diffDays === 1) return { text: 'Tomorrow', isOverdue: false, isToday: false };
  if (diffDays === -1) return { text: 'Carried Over', isOverdue: true, isToday: false };
  if (diffDays < -1) return { text: `${Math.abs(diffDays)}d Carried Over`, isOverdue: true, isToday: false };
  if (diffDays <= 7) {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return { text: dayNames[target.getDay()], isOverdue: false, isToday: false };
  }

  return { text: target.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), isOverdue: false, isToday: false };
}
