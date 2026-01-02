
import { ExchangeRates, CurrencyOption } from "../types/currencyTypes";
import { supabase } from "@/integrations/supabase/client";
// Import centralized utilities from formatters
import {
  normalizeCurrency,
  areCurrenciesEqual,
  formatCurrency,
  getCurrencySymbol as getSymbol,
  addCurrencySymbol as addSymbol
} from "@/utils/formatters";

// Re-export for backward compatibility
export { normalizeCurrency, areCurrenciesEqual };

// formatCurrencyValue has been removed - use formatCurrency from @/utils/formatters directly

/**
 * @deprecated Use getCurrencySymbol from @/utils/formatters instead
 */
export const getCurrencySymbol = getSymbol;

/**
 * @deprecated Use addCurrencySymbol from @/utils/formatters instead
 */
export const addCurrencySymbol = (price: string, currency: string): string => {
  // Note: Original signature was (string, string), formatters uses (number, string)
  // Keep wrapper for backward compatibility
  const numPrice = parseFloat(price.replace(/[^\d.-]/g, ''));
  return addSymbol(isNaN(numPrice) ? 0 : numPrice, currency);
};

import { logger } from '@/utils/logger';

// This function is deprecated - use useExchangeRates hook from dashboard instead
export const fetchTCMBExchangeRates = async (): Promise<ExchangeRates> => {
  logger.warn("fetchTCMBExchangeRates is deprecated. Use useExchangeRates hook from dashboard instead.");
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
