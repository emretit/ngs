import { format, startOfWeek as dateFnsStartOfWeek, isSameDay as dateFnsIsSameDay, addDays, formatDistanceToNow, isValid, parseISO } from 'date-fns';
import { tr, enUS } from 'date-fns/locale';

/**
 * Get locale based on current language
 */
const getLocale = () => {
  if (typeof window !== 'undefined') {
    const lang = localStorage.getItem('i18nextLng') || 'tr';
    return lang === 'en' ? enUS : tr;
  }
  return tr;
};

/**
 * Parse a date safely, returns null for invalid dates
 * @param date - Date string, Date object, or null/undefined
 * @returns Valid Date object or null
 */
export const parseDate = (date: Date | string | null | undefined): Date | null => {
  if (!date) return null;
  
  if (date instanceof Date) {
    return isValid(date) ? date : null;
  }
  
  try {
    const parsed = parseISO(date);
    return isValid(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

/**
 * Format a date with the given format string
 * @param date - Date to format
 * @param formatStr - Format string (e.g., 'dd.MM.yyyy', 'HH:mm')
 * @returns Formatted date string
 */
export const formatDate = (date: Date | string | null | undefined, formatStr: string = 'dd.MM.yyyy'): string => {
  const parsed = parseDate(date);
  if (!parsed) return '';
  return format(parsed, formatStr, { locale: getLocale() });
};

/**
 * Format a date and time
 * @param date - Date to format
 * @returns Formatted datetime string (dd.MM.yyyy HH:mm)
 */
export const formatDateTime = (date: Date | string | null | undefined): string => {
  return formatDate(date, 'dd.MM.yyyy HH:mm');
};

/**
 * Format time from a date
 * @param date - Date to format
 * @param formatStr - Format string (default: 'HH:mm')
 * @returns Formatted time string
 */
export const formatTime = (date: Date | string | null | undefined, formatStr: string = 'HH:mm'): string => {
  const parsed = parseDate(date);
  if (!parsed) return '';
  return format(parsed, formatStr, { locale: getLocale() });
};

/**
 * Format a date as relative time (e.g., "2 saat önce")
 * @param date - Date to format
 * @returns Relative time string
 */
export const formatRelativeTime = (date: Date | string | null | undefined): string => {
  const parsed = parseDate(date);
  if (!parsed) return '';
  return formatDistanceToNow(parsed, { addSuffix: true, locale: getLocale() });
};

/**
 * Get the start of the week (Monday)
 * @param date - Date to get start of week from
 * @returns Date at the start of the week
 */
export const startOfWeek = (date: Date): Date => {
  return dateFnsStartOfWeek(date, { weekStartsOn: 1, locale: getLocale() });
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

/**
 * Format a date as YYYY-MM-DD string using local timezone (not UTC)
 * This prevents timezone issues where selecting a date might save as the previous day
 * @param date - Date to format
 * @returns Formatted date string in YYYY-MM-DD format
 */
export const formatDateToLocalString = (date: Date | null | undefined): string | null => {
  if (!date) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Get month name
 * @param month - Month number (1-12)
 * @returns Month name
 */
export const getMonthName = (month: number): string => {
  const locale = getLocale();
  const date = new Date(2000, month - 1, 1);
  return format(date, 'MMMM', { locale });
};

/**
 * Get short month name
 * @param month - Month number (1-12)
 * @returns Short month name
 */
export const getShortMonthName = (month: number): string => {
  const locale = getLocale();
  const date = new Date(2000, month - 1, 1);
  return format(date, 'MMM', { locale });
};
