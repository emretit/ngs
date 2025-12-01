
import { ExchangeRates, CurrencyOption } from "../types/currencyTypes";
import { supabase } from "@/integrations/supabase/client";

/**
 * Normalizes currency code: TRY is the standard code
 * @param currency The currency code to normalize
 * @returns Normalized currency code (TRY for TRY/TL, otherwise unchanged)
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

// Format a currency value for display
export const formatCurrencyValue = (amount: number, currency: string = "TRY"): string => {
  // Ensure currency is not empty to avoid Intl.NumberFormat errors
  if (!currency) currency = "TRY";
  
  // Intl.NumberFormat için geçerli currency code kullan (TRY -> TRY)
  const currencyCode = currency === 'TL' ? 'TRY' : currency;
  const formatter = new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  
  return formatter.format(amount);
};

// This function is deprecated - use useExchangeRates hook from dashboard instead
export const fetchTCMBExchangeRates = async (): Promise<ExchangeRates> => {
  console.warn("fetchTCMBExchangeRates is deprecated. Use useExchangeRates hook from dashboard instead.");
  // Return fallback rates as last resort
  return {
    TRY: 1,
    USD: 32.5,
    EUR: 35.2,
    GBP: 41.3
  };
};

// Convert an amount from one currency to another
export const convertCurrency = (
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: ExchangeRates
): number => {
  // Normalize TRY to TL for comparison
  const normalizedFrom = normalizeCurrency(fromCurrency);
  const normalizedTo = normalizeCurrency(toCurrency);
  
  // If currencies are the same, no conversion needed
  if (normalizedFrom === normalizedTo) return amount;
  
  // Handle TRY as the base currency 
  if (normalizedFrom === "TRY") {
    return amount / (rates[normalizedTo] || 1);
  }
  
  // Convert from source currency to TRY first, then to target currency
  const amountInTRY = amount * (rates[normalizedFrom] || 1);
  return normalizedTo === "TRY" ? amountInTRY : amountInTRY / (rates[normalizedTo] || 1);
};

// Format a price with a specified number of decimal places
export const formatPrice = (price: number, decimals: number = 2): string => {
  return price.toFixed(decimals);
};

// Add currency symbol to a formatted price
export const addCurrencySymbol = (price: string, currency: string): string => {
  const symbols: Record<string, string> = {
    TRY: '₺',
    TL: '₺', // Backward compatibility
    USD: '$',
    EUR: '€',
    GBP: '£'
  };
  
  const normalizedCurrency = currency === 'TL' ? 'TRY' : currency;
  return `${symbols[normalizedCurrency] || symbols[currency] || currency} ${price}`;
};

// Get currency symbol for a given currency code
export const getCurrencySymbol = (currency: string): string => {
  const symbols: Record<string, string> = {
    TRY: '₺',
    TL: '₺', // Backward compatibility
    USD: '$',
    EUR: '€',
    GBP: '£'
  };
  
  const normalizedCurrency = currency === 'TL' ? 'TRY' : currency;
  return symbols[normalizedCurrency] || symbols[currency] || currency;
};

// Get currency options for dropdowns
export const getCurrencyOptions = (): CurrencyOption[] => {
  return [
    { value: "TRY", label: "₺ TRY", symbol: "₺" },
    { value: "USD", label: "$ USD", symbol: "$" },
    { value: "EUR", label: "€ EUR", symbol: "€" },
    { value: "GBP", label: "£ GBP", symbol: "£" }
  ];
};

// Get current exchange rates (for synchronous contexts)
export const getCurrentExchangeRates = (): ExchangeRates => {
  // Default rates (these will be replaced by API values when available)
  return {
    TRY: 1,
    USD: 32.5,
    EUR: 35.2,
    GBP: 41.3
  };
};

// Format exchange rate display
export const formatExchangeRate = (fromCurrency: string, toCurrency: string, rate: number): string => {
  const normalizedToCurrency = toCurrency === 'TL' ? 'TRY' : toCurrency;
  return `1 ${fromCurrency} = ${rate.toFixed(2)} ${normalizedToCurrency}`;
};

// Calculate exchange rate between two currencies
export const calculateExchangeRate = (fromCurrency: string, toCurrency: string, rates: ExchangeRates): number => {
  const normalizedFrom = fromCurrency === 'TL' ? 'TRY' : fromCurrency;
  const normalizedTo = toCurrency === 'TL' ? 'TRY' : toCurrency;
  
  if (normalizedFrom === normalizedTo) return 1;
  
  if (normalizedFrom === 'TRY') {
    return 1 / (rates[normalizedTo] || 1);
  }
  
  if (normalizedTo === 'TRY') {
    return rates[normalizedFrom] || 1;
  }
  
  // Cross-currency rate
  const fromRate = rates[fromCurrency] || 1;
  const toRate = rates[toCurrency] || 1;
  return fromRate / toRate;
};
