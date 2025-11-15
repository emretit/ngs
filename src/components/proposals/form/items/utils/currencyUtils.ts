
import { ExchangeRates, CurrencyOption } from "../types/currencyTypes";
import { supabase } from "@/integrations/supabase/client";

/**
 * Normalizes currency code: TRY and TL are treated as the same (returns TL for display)
 * @param currency The currency code to normalize
 * @returns Normalized currency code (TL for TRY/TL, otherwise unchanged)
 */
export const normalizeCurrency = (currency: string | null | undefined): string => {
  if (!currency) return 'TL';
  return currency === 'TRY' ? 'TL' : currency;
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
export const formatCurrencyValue = (amount: number, currency: string = "TL"): string => {
  // Ensure currency is not empty to avoid Intl.NumberFormat errors
  if (!currency) currency = "TL";
  
  // Intl.NumberFormat için geçerli currency code kullan (TL -> TRY)
  const currencyCode = currency === 'TL' ? 'TRY' : currency;
  const formatter = new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  
  const formatted = formatter.format(amount);
  // TRY yerine TL göster
  return formatted.replace('TRY', 'TL');
};

// This function is deprecated - use useExchangeRates hook from dashboard instead
export const fetchTCMBExchangeRates = async (): Promise<ExchangeRates> => {
  console.warn("fetchTCMBExchangeRates is deprecated. Use useExchangeRates hook from dashboard instead.");
  // Return fallback rates as last resort
  return {
    TL: 1,
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
  
  // Handle TL as the base currency 
  if (normalizedFrom === "TL") {
    return amount / (rates[normalizedTo] || 1);
  }
  
  // Convert from source currency to TL first, then to target currency
  const amountInTL = amount * (rates[normalizedFrom] || 1);
  return normalizedTo === "TL" ? amountInTL : amountInTL / (rates[normalizedTo] || 1);
};

// Format a price with a specified number of decimal places
export const formatPrice = (price: number, decimals: number = 2): string => {
  return price.toFixed(decimals);
};

// Add currency symbol to a formatted price
export const addCurrencySymbol = (price: string, currency: string): string => {
  const symbols: Record<string, string> = {
    TL: '₺',
    USD: '$',
    EUR: '€',
    GBP: '£'
  };
  
  return `${symbols[currency] || currency} ${price}`;
};

// Get currency symbol for a given currency code
export const getCurrencySymbol = (currency: string): string => {
  const symbols: Record<string, string> = {
    TL: '₺',
    USD: '$',
    EUR: '€',
    GBP: '£'
  };
  
  return symbols[currency] || currency;
};

// Get currency options for dropdowns
export const getCurrencyOptions = (): CurrencyOption[] => {
  return [
    { value: "TL", label: "₺ TL", symbol: "₺" },
    { value: "USD", label: "$ USD", symbol: "$" },
    { value: "EUR", label: "€ EUR", symbol: "€" },
    { value: "GBP", label: "£ GBP", symbol: "£" }
  ];
};

// Get current exchange rates (for synchronous contexts)
export const getCurrentExchangeRates = (): ExchangeRates => {
  // Default rates (these will be replaced by API values when available)
  return {
    TL: 1,
    USD: 32.5,
    EUR: 35.2,
    GBP: 41.3
  };
};

// Format exchange rate display
export const formatExchangeRate = (fromCurrency: string, toCurrency: string, rate: number): string => {
  const displayToCurrency = toCurrency === 'TL' ? 'TL' : toCurrency;
  return `1 ${fromCurrency} = ${rate.toFixed(2)} ${displayToCurrency}`;
};

// Calculate exchange rate between two currencies
export const calculateExchangeRate = (fromCurrency: string, toCurrency: string, rates: ExchangeRates): number => {
  if (fromCurrency === toCurrency) return 1;
  
  if (fromCurrency === 'TL') {
    return 1 / (rates[toCurrency] || 1);
  }
  
  if (toCurrency === 'TL') {
    return rates[fromCurrency] || 1;
  }
  
  // Cross-currency rate
  const fromRate = rates[fromCurrency] || 1;
  const toRate = rates[toCurrency] || 1;
  return fromRate / toRate;
};
