
import { ExchangeRates } from "../../types/currencyTypes";
import { normalizeCurrency } from "../../utils/currencyUtils";

export const useCurrencyConverter = (exchangeRates: ExchangeRates) => {
  // Convert amount between currencies
  const convertAmount = (amount: number, fromCurrency: string, toCurrency: string) => {
    // Normalize currency for comparison
    const normalizedFrom = normalizeCurrency(fromCurrency);
    const normalizedTo = normalizeCurrency(toCurrency);
    
    if (normalizedFrom === normalizedTo) return amount;
    
    // Convert to TRY first (base currency)
    const amountInTRY = normalizedFrom === "TRY" 
      ? amount 
      : amount * exchangeRates[normalizedFrom];
    
    // Then convert from TRY to target currency
    const result = normalizedTo === "TRY" 
      ? amountInTRY 
      : amountInTRY / exchangeRates[normalizedTo];
    
    // Round to 4 decimal places
    return Math.round(result * 10000) / 10000;
  };

  return {
    convertAmount
  };
};
