
/**
 * Helper function to format date as ISO string with an offset of days
 * @param daysOffset Number of days to offset from current date
 * @returns ISO string date
 */
export const formatDateOffset = (daysOffset: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString();
};
