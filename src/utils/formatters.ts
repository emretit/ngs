
/**
 * Normalizes currency code: TRY is the standard code
 * @param currency The currency code to normalize
 * @returns Normalized currency code (TRY for TL/TRY, otherwise unchanged)
 */
export const normalizeCurrency = (currency: string | null | undefined): string => {
  if (!currency) return 'TRY';
  return currency === 'TL' ? 'TRY' : currency;
};

/**
 * Compares two currencies, treating TRY and TL as the same
 * @param currency1 First currency code
 * @param currency2 Second currency code
 * @returns true if currencies are the same (including TRY === TL)
 */
export const areCurrenciesEqual = (currency1: string | null | undefined, currency2: string | null | undefined): boolean => {
  const normalized1 = normalizeCurrency(currency1);
  const normalized2 = normalizeCurrency(currency2);
  return normalized1 === normalized2;
};

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
  // Handle NaN, undefined, null, or invalid numbers
  const validAmount = isNaN(amount) || !isFinite(amount) ? 0 : amount;
  // Intl.NumberFormat için geçerli currency code kullan
  const currencyCode = currency === 'TL' ? 'TRY' : (currency || 'TRY');
  return new Intl.NumberFormat('tr-TR', { 
    style: 'currency', 
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(validAmount);
};
