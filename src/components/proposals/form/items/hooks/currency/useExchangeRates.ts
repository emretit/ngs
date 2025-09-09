
import { useState, useEffect } from "react";
import { fetchTCMBExchangeRates } from "../../utils/currencyUtils";
import { ExchangeRates } from "../../types/currencyTypes";

export const useExchangeRates = () => {
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates>({
    TRY: 1,
    USD: 32.5,
    EUR: 35.2,
    GBP: 41.3
  });
  const [isLoadingRates, setIsLoadingRates] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const getExchangeRates = async () => {
      setIsLoadingRates(true);
      try {
        const rates = await fetchTCMBExchangeRates();
        setExchangeRates(rates);
        console.log("Exchange rates loaded:", rates);
      } catch (error) {
        console.error("Error fetching exchange rates:", error);
        setError(error instanceof Error ? error : new Error('Unknown error fetching exchange rates'));
      } finally {
        setIsLoadingRates(false);
      }
    };

    getExchangeRates();
  }, []);

  return {
    exchangeRates,
    isLoadingRates,
    error
  };
};
