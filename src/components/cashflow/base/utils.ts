import type { AccountType } from "./types";

/**
 * Format card number with dashes (4-digit groups)
 * @param number Card number
 * @returns Formatted card number (e.g., "1234-5678-9012-3456")
 */
export const formatCardNumber = (number: string | null | undefined): string => {
  if (!number) return "";

  // Extract only digits
  const numbers = number.replace(/\D/g, '');
  if (!numbers) return "";

  // Format in 4-digit groups
  return numbers.replace(/(.{4})/g, '$1-').slice(0, -1);
};

/**
 * Format IBAN with dashes (4-character groups)
 * @param iban IBAN string
 * @returns Formatted IBAN or masked placeholder
 */
export const formatIBAN = (iban: string | null | undefined): string => {
  if (!iban) return "****-****-****-****";
  return iban.replace(/(.{4})/g, '$1-').slice(0, -1);
};

/**
 * Calculate totals by currency
 * Generic function to sum values grouped by currency
 * @param items Array of items with currency field
 * @param valueExtractor Function to extract numeric value from each item
 * @returns Object with totals per currency
 */
export const calculateCurrencyTotals = <T extends { currency: string }>(
  items: T[],
  valueExtractor: (item: T) => number
): Record<string, { total: number; count: number }> => {
  return items.reduce((acc, item) => {
    const currency = item.currency || 'TRY';
    if (!acc[currency]) {
      acc[currency] = { total: 0, count: 0 };
    }
    acc[currency].total += valueExtractor(item);
    acc[currency].count += 1;
    return acc;
  }, {} as Record<string, { total: number; count: number }>);
};

/**
 * Get breadcrumb navigation text for account type
 * @param type Account type
 * @returns Localized breadcrumb text
 */
export const getBreadcrumbText = (type: AccountType): string => {
  const labels: Record<AccountType, string> = {
    credit_card: 'Kredi Kartları',
    cash: 'Nakit Hesapları',
    partner: 'Ortak Hesapları',
    bank: 'Banka Hesapları',
  };
  return labels[type];
};

/**
 * Get base path for account type
 * @param type Account type
 * @returns Base path for navigation
 */
export const getAccountBasePath = (type: AccountType): string => {
  const paths: Record<AccountType, string> = {
    credit_card: '/cashflow/credit-cards',
    cash: '/cashflow/cash-accounts',
    partner: '/cashflow/partner-accounts',
    bank: '/cashflow/bank-accounts',
  };
  return paths[type];
};

/**
 * Get account type label in Turkish
 * @param type Account type
 * @returns Localized account type label
 */
export const getAccountTypeLabel = (type: AccountType): string => {
  const labels: Record<AccountType, string> = {
    credit_card: 'Kredi Kartı',
    cash: 'Nakit Hesabı',
    partner: 'Ortak Hesabı',
    bank: 'Banka Hesabı',
  };
  return labels[type];
};

/**
 * Mask sensitive information (card numbers, IBAN, etc.)
 * Shows only last 4 digits
 * @param value Value to mask
 * @returns Masked value
 */
export const maskSensitiveInfo = (value: string | null | undefined): string => {
  if (!value) return "****";

  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length <= 4) return value;

  const lastFour = cleaned.slice(-4);
  return `****-****-****-${lastFour}`;
};

/**
 * Truncate long text with ellipsis
 * @param text Text to truncate
 * @param maxLength Maximum length
 * @returns Truncated text
 */
export const truncateText = (text: string, maxLength: number = 50): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Get status badge classes based on status
 * @param isActive Active status
 * @returns Tailwind classes for badge
 */
export const getStatusBadgeClasses = (isActive: boolean): string => {
  return isActive
    ? 'bg-green-100 text-green-800 border-green-200'
    : 'bg-red-100 text-red-800 border-red-200';
};

/**
 * Get status text
 * @param isActive Active status
 * @returns Localized status text
 */
export const getStatusText = (isActive: boolean): string => {
  return isActive ? 'Aktif' : 'Pasif';
};

/**
 * Format percentage value
 * @param value Percentage value (0-100)
 * @returns Formatted percentage string
 */
export const formatPercentage = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '0%';
  return `${value.toFixed(2)}%`;
};

/**
 * Parse numeric input value
 * @param value String value from input
 * @returns Parsed number or 0
 */
export const parseNumericInput = (value: string): number => {
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Validate required field
 * @param value Field value
 * @returns True if valid
 */
export const isRequired = (value: string | number | null | undefined): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  return true;
};

/**
 * Get currency symbol
 * @param currency Currency code
 * @returns Currency symbol
 */
export const getCurrencySymbol = (currency: string): string => {
  const symbols: Record<string, string> = {
    'TRY': '₺',
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
  };
  return symbols[currency] || currency;
};
