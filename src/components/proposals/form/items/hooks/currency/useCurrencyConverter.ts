
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
    return toCurrency === "TRY" 
      ? amountInTRY 
      : amountInTRY / exchangeRates[toCurrency];
  };

  return {
    convertAmount
  };
};
