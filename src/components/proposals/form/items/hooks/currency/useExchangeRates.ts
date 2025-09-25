
import { useExchangeRates as useDashboardExchangeRates } from "@/hooks/useExchangeRates";

export const useExchangeRates = () => {
  const dashboardRates = useDashboardExchangeRates();
  
  // Convert dashboard format to proposal format
  const exchangeRates = {
    TRY: 1,
    USD: dashboardRates.exchangeRates.find(rate => rate.currency_code === 'USD')?.forex_selling || 32.5,
    EUR: dashboardRates.exchangeRates.find(rate => rate.currency_code === 'EUR')?.forex_selling || 35.2,
    GBP: dashboardRates.exchangeRates.find(rate => rate.currency_code === 'GBP')?.forex_selling || 41.3
  };

  return {
    exchangeRates,
    isLoadingRates: dashboardRates.loading,
    error: dashboardRates.error
  };
};
