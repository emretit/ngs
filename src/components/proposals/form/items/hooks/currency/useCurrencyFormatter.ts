
import { getCurrencySymbol } from "../../utils/currencyUtils";

export const useCurrencyFormatter = () => {
  // Format currency
  const formatCurrency = (amount: number, currency: string = "TRY") => {
    // Ensure currency is not empty to avoid Intl.NumberFormat errors
    if (!currency) currency = "TRY";
    
    const formatter = new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    
    return formatter.format(amount);
  };

  // Get currency symbol
  const getCurrencySymbolValue = (currency: string = "TRY") => {
    return getCurrencySymbol(currency);
  };

  return {
    formatCurrency,
    getCurrencySymbol: getCurrencySymbolValue
  };
};
