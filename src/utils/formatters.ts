
/**
 * Capitalizes the first letter of a string
 * @param string The string to capitalize
 * @returns The capitalized string
 */
export const capitalizeFirstLetter = (string: string): string => {
  if (!string) return '';
  return string.charAt(0).toUpperCase() + string.slice(1);
};

/**
 * Formats a number as currency with the Turkish Lira symbol
 * @param amount The amount to format
 * @param currency The currency code (default: 'TRY')
 * @returns The formatted currency string
 */
export const formatCurrency = (amount: number, currency = 'TRY'): string => {
  return new Intl.NumberFormat('tr-TR', { 
    style: 'currency', 
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};
