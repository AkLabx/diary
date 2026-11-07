/**
 * Sanctuary Recurrence Engine
 * Computes next occurrence dates for recurring personal tasks
 * without aggressive spamming or unneeded database clutter.
 */

export type RecurrenceFrequency = 'none' | 'daily' | 'weekdays' | 'weekly' | 'monthly';

export interface RecurrenceOption {
  value: RecurrenceFrequency;
  label: string;
  icon: string;
  description: string;
}

export const RECURRENCE_OPTIONS: RecurrenceOption[] = [
  { value: 'none', label: 'Does not repeat', icon: '🌱', description: 'Single occurrence' },
  { value: 'daily', label: 'Daily', icon: '🔁', description: 'Repeats every day' },
  { value: 'weekdays', label: 'Weekdays', icon: '💼', description: 'Monday through Friday' },
  { value: 'weekly', label: 'Weekly', icon: '📅', description: 'Repeats every 7 days' },
  { value: 'monthly', label: 'Monthly', icon: '🌕', description: 'Repeats on the same day each month' },
];

/**
 * Calculates the next occurrence date (YYYY-MM-DD) based on recurrence rule and base date.
 */
export function computeNextDueDate(
  frequency?: RecurrenceFrequency,
  baseDateStr?: string | null
): string | null {
  if (!frequency || frequency === 'none') return null;

  // If no base date provided, use today's local date
  const base = baseDateStr ? new Date(`${baseDateStr}T00:00:00`) : new Date();
  if (isNaN(base.getTime())) return null;

  const next = new Date(base.getTime());

  switch (frequency) {
    case 'daily': {
      next.setDate(next.getDate() + 1);
      break;
    }
    case 'weekdays': {
      const currentDay = next.getDay(); // 0 = Sun, 1 = Mon, ..., 5 = Fri, 6 = Sat
      if (currentDay === 5) {
        // Friday -> Jump 3 days to Monday
        next.setDate(next.getDate() + 3);
      } else if (currentDay === 6) {
        // Saturday -> Jump 2 days to Monday
        next.setDate(next.getDate() + 2);
      } else {
        // Sun-Thu -> Next calendar day
        next.setDate(next.getDate() + 1);
      }
      break;
    }
    case 'weekly': {
      next.setDate(next.getDate() + 7);
      break;
    }
    case 'monthly': {
      const dayOfMonth = next.getDate();
      next.setMonth(next.getMonth() + 1);
      // Handle edge cases where target month has fewer days (e.g. Jan 31 -> Feb 28)
      if (next.getDate() !== dayOfMonth) {
        next.setDate(0); // Sets to last day of previous month
      }
      break;
    }
    default:
      return null;
  }

  const year = next.getFullYear();
  const month = String(next.getMonth() + 1).padStart(2, '0');
  const day = String(next.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns a human-friendly label for a recurrence frequency.
 */
export function formatRecurrenceLabel(frequency?: RecurrenceFrequency): string {
  if (!frequency || frequency === 'none') return '';
  const match = RECURRENCE_OPTIONS.find(opt => opt.value === frequency);
  return match ? `${match.icon} ${match.label}` : '';
}
