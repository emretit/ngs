
import { ExchangeRates } from "../../types/currencyTypes";
import { normalizeCurrency } from "../../utils/currencyUtils";

export const useCurrencyConverter = (exchangeRates: ExchangeRates) => {
  // Convert amount between currencies
  const convertAmount = (amount: number, fromCurrency: string, toCurrency: string) => {
    // Normalize TRY to TL for comparison
    const normalizedFrom = normalizeCurrency(fromCurrency);
    const normalizedTo = normalizeCurrency(toCurrency);
    
    if (normalizedFrom === normalizedTo) return amount;
    
    // Convert to TL first (base currency)
    const amountInTL = normalizedFrom === "TL" 
      ? amount 
      : amount * exchangeRates[normalizedFrom];
    
    // Then convert from TL to target currency
    const result = normalizedTo === "TL" 
      ? amountInTL 
      : amountInTL / exchangeRates[normalizedTo];
    
    // Round to 4 decimal places
    return Math.round(result * 10000) / 10000;
  };

  return {
    convertAmount
  };
};
