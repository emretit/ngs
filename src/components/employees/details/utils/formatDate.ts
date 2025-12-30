/**
 * @deprecated Import formatDate from @/utils/dateUtils instead
 * This is a re-export for backward compatibility
 */
import { formatDate as baseDateFormat } from '@/utils/dateUtils';

export const formatDate = (dateString?: string | null): string => {
  if (!dateString) return "-";
  try {
    // Use centralized dateUtils with 'dd.MM.yyyy' format
    return baseDateFormat(dateString, 'dd.MM.yyyy') || "-";
  } catch (error) {
    console.error('Date formatting error:', error);
    return dateString || "-";
  }
};
