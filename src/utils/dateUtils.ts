import { format, startOfWeek as dateFnsStartOfWeek, isSameDay as dateFnsIsSameDay, addDays } from 'date-fns';
import { tr } from 'date-fns/locale';

/**
 * Format a date with the given format string
 * @param date - Date to format
 * @param formatStr - Format string (e.g., 'dd.MM.yyyy', 'HH:mm')
 * @returns Formatted date string
 */
export const formatDate = (date: Date | string | null | undefined, formatStr: string = 'dd.MM.yyyy'): string => {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, formatStr, { locale: tr });
};

/**
 * Get the start of the week (Monday)
 * @param date - Date to get start of week from
 * @returns Date at the start of the week
 */
export const startOfWeek = (date: Date): Date => {
  return dateFnsStartOfWeek(date, { weekStartsOn: 1, locale: tr });
};

/**
 * Check if two dates are the same day
 * @param date1 - First date
 * @param date2 - Second date
 * @returns True if same day, false otherwise
 */
export const isSameDay = (date1: Date, date2: Date): boolean => {
  return dateFnsIsSameDay(date1, date2);
};

/**
 * Add days to a date
 * @param date - Base date
 * @param amount - Number of days to add
 * @returns New date with days added
 */
export const addDaysToDate = (date: Date, amount: number): Date => {
  return addDays(date, amount);
};
