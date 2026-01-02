import { formatCurrency as formatCurrencyUtil, getCurrencySymbol as getCurrencySymbolUtil } from "@/utils/formatters";

/**
 * Hook for currency formatting
 * @deprecated Consider using formatCurrency and getCurrencySymbol directly from @/utils/formatters
 * This hook is kept for backward compatibility
 */
export const useCurrencyFormatter = () => {
  // Format currency using centralized utility
  const formatCurrency = (amount: number, currency: string = "TRY") => {
    return formatCurrencyUtil(amount, currency);
  };

  // Get currency symbol using centralized utility
  const getCurrencySymbolValue = (currency: string = "TRY") => {
    return getCurrencySymbolUtil(currency);
  };

  return {
    formatCurrency,
    getCurrencySymbol: getCurrencySymbolValue
  };
};
