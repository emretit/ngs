
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
 * @param currency The currency code (default: 'TL')
 * @returns The formatted currency string
 */
export const formatCurrency = (amount: number, currency = 'TL'): string => {
  // Handle NaN, undefined, null, or invalid numbers
  const validAmount = isNaN(amount) || !isFinite(amount) ? 0 : amount;
  // Intl.NumberFormat için geçerli currency code kullan (TL -> TRY)
  const currencyCode = currency === 'TL' ? 'TRY' : currency;
  const formatted = new Intl.NumberFormat('tr-TR', { 
    style: 'currency', 
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(validAmount);
  
  // TRY yerine TL göster
  return formatted.replace('TRY', 'TL');
};
