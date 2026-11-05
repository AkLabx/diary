/**
 * Client-Side Natural Language Smart Date Parser
 * Parses natural expressions like "today", "tomorrow", "next monday", "in 3 days"
 * and extracts both the sanitized task title and the target ISO date string.
 */

export interface ParsedDateResult {
  title: string;
  dueDate: string | null; // "YYYY-MM-DD"
  rawMatchedExpression?: string;
}

export function parseNaturalDate(input: string): ParsedDateResult {
  if (!input || !input.trim()) {
    return { title: '', dueDate: null };
  }

  const text = input.trim();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const formatDate = (d: Date): string => {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  // 1. "today" / "tonight"
  const todayRegex = /\b(today|tonight)\b/i;
  if (todayRegex.test(text)) {
    return {
      title: text.replace(todayRegex, '').replace(/\s+/g, ' ').trim(),
      dueDate: formatDate(today),
      rawMatchedExpression: 'today',
    };
  }

  // 2. "tomorrow" / "tmrw"
  const tmrwRegex = /\b(tomorrow|tmrw)\b/i;
  if (tmrwRegex.test(text)) {
    const tmrw = new Date(today);
    tmrw.setDate(today.getDate() + 1);
    return {
      title: text.replace(tmrwRegex, '').replace(/\s+/g, ' ').trim(),
      dueDate: formatDate(tmrw),
      rawMatchedExpression: 'tomorrow',
    };
  }

  // 3. "in X days" / "in X weeks"
  const inDaysRegex = /\bin\s+(\d+)\s+(day|days|week|weeks)\b/i;
  const inDaysMatch = text.match(inDaysRegex);
  if (inDaysMatch) {
    const amount = parseInt(inDaysMatch[1], 10);
    const unit = inDaysMatch[2].toLowerCase();
    const targetDate = new Date(today);
    if (unit.startsWith('week')) {
      targetDate.setDate(today.getDate() + amount * 7);
    } else {
      targetDate.setDate(today.getDate() + amount);
    }
    return {
      title: text.replace(inDaysRegex, '').replace(/\s+/g, ' ').trim(),
      dueDate: formatDate(targetDate),
      rawMatchedExpression: inDaysMatch[0],
    };
  }

  // 4. "next [weekday]" or "on [weekday]"
  const weekdayRegex = /\b(next|on|this)?\s*(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i;
  const weekdayMatch = text.match(weekdayRegex);
  if (weekdayMatch) {
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const targetDayIndex = dayNames.indexOf(weekdayMatch[2].toLowerCase());
    if (targetDayIndex !== -1) {
      const currentDayIndex = today.getDay();
      let daysAhead = targetDayIndex - currentDayIndex;
      if (daysAhead <= 0) {
        daysAhead += 7; // Next occurrence
      }
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + daysAhead);
      return {
        title: text.replace(weekdayRegex, '').replace(/\s+/g, ' ').trim(),
        dueDate: formatDate(targetDate),
        rawMatchedExpression: weekdayMatch[0],
      };
    }
  }

  // 5. Default: No date expression detected
  return {
    title: text,
    dueDate: null,
  };
}
