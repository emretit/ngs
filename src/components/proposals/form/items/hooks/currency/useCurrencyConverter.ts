
import { ExchangeRates } from "../../types/currencyTypes";

export const useCurrencyConverter = (exchangeRates: ExchangeRates) => {
  // Convert amount between currencies
  const convertAmount = (amount: number, fromCurrency: string, toCurrency: string) => {
    if (fromCurrency === toCurrency) return amount;
    
    // Convert to TRY first (base currency)
    const amountInTRY = fromCurrency === "TRY" 
      ? amount 
      : amount * exchangeRates[fromCurrency];
    
    // Then convert from TRY to target currency
    const result = toCurrency === "TRY" 
      ? amountInTRY 
      : amountInTRY / exchangeRates[toCurrency];
    
    // Round to 4 decimal places
    return Math.round(result * 10000) / 10000;
  };

  return {
    convertAmount
  };
};
