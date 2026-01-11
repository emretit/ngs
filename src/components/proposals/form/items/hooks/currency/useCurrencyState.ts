
import { useState, useCallback, useEffect } from "react";
import { logger } from '@/utils/logger';
import { getCurrencyOptions } from "../../utils/currencyUtils";
import { toast } from "sonner";

export const useCurrencyState = (defaultCurrency?: string) => {
  // Normalize currency to TRY
  const normalizedDefault = defaultCurrency === "TL" ? "TRY" : (defaultCurrency || "TRY");
  const [selectedCurrency, setSelectedCurrency] = useState<string>(normalizedDefault);
  const currencyOptions = getCurrencyOptions();

  // Reset selectedCurrency when defaultCurrency changes (e.g., when dialog opens with new product)
  useEffect(() => {
    const normalized = defaultCurrency === "TL" ? "TRY" : (defaultCurrency || "TRY");
    setSelectedCurrency(normalized);
  }, [defaultCurrency]);

  const handleCurrencyChange = useCallback((newCurrency: string) => {
    logger.debug(`Currency changed to ${newCurrency}`);
    setSelectedCurrency(newCurrency);
    
    // Dispatch a custom event to notify other components about the currency change
    window.dispatchEvent(new CustomEvent('currency-change', { detail: newCurrency }));
    
    toast.success(`Para birimi ${newCurrency} olarak değiştirildi`);
  }, []);

  return {
    selectedCurrency,
    setSelectedCurrency,
    currencyOptions,
    handleCurrencyChange
  };
};
