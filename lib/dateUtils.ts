import { format, formatDistanceToNow, isToday, isYesterday, isThisWeek } from 'date-fns';

/**
 * Formats a timestamp string into a user-friendly, relative format.
 * - Today: "about 5 hours ago"
 * - Yesterday: "Yesterday"
 * - This week: "Tuesday"
 * - Older: "April 15, 2024"
 * @param dateString The ISO date string to format.
 * @returns A formatted string.
 */
export const formatTimestamp = (dateString: string): string => {
  try {
    const date = new Date(dateString);

    if (isToday(date)) {
      return formatDistanceToNow(date, { addSuffix: true });
    }
    if (isYesterday(date)) {
      return 'Yesterday';
    }
    // Check if the date is within the current week (starting on Sunday)
    if (isThisWeek(date, { weekStartsOn: 0 })) {
      return format(date, 'EEEE'); // e.g., "Tuesday"
    }

    return format(date, 'MMMM d, yyyy');
  } catch (error) {
    console.error("Error formatting date:", dateString, error);
    return "Invalid date";
  }
};

/**
 * Formats a timestamp string into a full, detailed format.
 * e.g., "Tuesday, April 16, 2024 at 5:30 PM"
 * @param dateString The ISO date string to format.
 * @returns A formatted string.
 */
export const formatFullTimestamp = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return format(date, "EEEE, MMMM d, yyyy 'at' p");
  } catch (error) {
    console.error("Error formatting full date:", dateString, error);
    return "Invalid date";
  }
};

/**
 * Formats a timestamp string into a relative time with a suffix.
 * e.g., "about 2 hours ago"
 * @param dateString The ISO date string to format.
 * @returns A formatted string.
 */
export const formatRelativeTime = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true });
  } catch (error) {
    console.error("Error formatting relative time:", dateString, error);
    return "Invalid time";
  }
};