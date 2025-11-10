
import { ExchangeRates } from "../../types/currencyTypes";

export const useCurrencyConverter = (exchangeRates: ExchangeRates) => {
  // Convert amount between currencies
  const convertAmount = (amount: number, fromCurrency: string, toCurrency: string) => {
    if (fromCurrency === toCurrency) return amount;
    
    // Convert to TL first (base currency)
    const amountInTL = fromCurrency === "TL" 
      ? amount 
      : amount * exchangeRates[fromCurrency];
    
    // Then convert from TL to target currency
    const result = toCurrency === "TL" 
      ? amountInTL 
      : amountInTL / exchangeRates[toCurrency];
    
    // Round to 4 decimal places
    return Math.round(result * 10000) / 10000;
  };

  return {
    convertAmount
  };
};
