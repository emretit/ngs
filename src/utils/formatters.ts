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
 * @param _options Additional options (for backward compatibility, ignored)
 * @returns The formatted currency string
 */
export const formatCurrency = (
  amount: number | null | undefined, 
  currency = 'TRY',
  // Backward compatibility - additional args are ignored
  ..._args: any[]
): string => {
  // Handle NaN, undefined, null, or invalid numbers
  const validAmount = (amount === null || amount === undefined || isNaN(amount) || !isFinite(amount)) ? 0 : amount;
  const currencyCode = normalizeCurrency(currency);
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(validAmount);
};

/**
 * Formats a number with Turkish locale (no currency symbol)
 * @param amount The amount to format
 * @param decimals Number of decimal places (default: 2)
 * @returns The formatted number string
 */
export const formatNumber = (amount: number | null | undefined, decimals = 2): string => {
  const validAmount = (amount === null || amount === undefined || isNaN(amount) || !isFinite(amount)) ? 0 : amount;
  return new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(validAmount);
};

/**
 * Formats a number as percentage
 * @param value The value to format (0.1 = 10%)
 * @param decimals Number of decimal places (default: 0)
 * @returns The formatted percentage string
 */
export const formatPercent = (value: number | null | undefined, decimals = 0): string => {
  const validValue = (value === null || value === undefined || isNaN(value) || !isFinite(value)) ? 0 : value;
  return new Intl.NumberFormat('tr-TR', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(validValue);
};

/**
 * Get currency symbol for a given currency code
 * @param currency The currency code
 * @returns The currency symbol
 */
export const getCurrencySymbol = (currency: string | null | undefined): string => {
  const symbols: Record<string, string> = {
    TRY: '₺',
    TL: '₺', // Backward compatibility
    USD: '$',
    EUR: '€',
    GBP: '£'
  };

  const normalizedCurrency = normalizeCurrency(currency);
  return symbols[normalizedCurrency] || normalizedCurrency;
};

/**
 * Add currency symbol to a formatted amount
 * @param amount The amount to format
 * @param currency The currency code
 * @returns Formatted string with currency symbol
 */
export const addCurrencySymbol = (amount: number | null | undefined, currency: string): string => {
  const validAmount = (amount === null || amount === undefined || isNaN(amount) || !isFinite(amount)) ? 0 : amount;
  return `${validAmount.toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })} ${getCurrencySymbol(currency)}`;
};

/**
 * Compact number formatting for large numbers (e.g., 1.2M, 5.3K)
 * @param amount The amount to format
 * @param currency Optional currency code
 * @returns Compact formatted string
 */
export const formatCompact = (amount: number | null | undefined, currency?: string): string => {
  const validAmount = (amount === null || amount === undefined || isNaN(amount) || !isFinite(amount)) ? 0 : amount;
  const absAmount = Math.abs(validAmount);
  
  let formatted: string;
  if (absAmount >= 1000000000) {
    formatted = `${(validAmount / 1000000000).toFixed(1)}B`;
  } else if (absAmount >= 1000000) {
    formatted = `${(validAmount / 1000000).toFixed(1)}M`;
  } else if (absAmount >= 1000) {
    formatted = `${(validAmount / 1000).toFixed(1)}K`;
  } else {
    formatted = formatNumber(validAmount, 0);
  }
  
  if (currency) {
    return `${getCurrencySymbol(currency)}${formatted}`;
  }
  return formatted;
};
