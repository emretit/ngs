
import { useState, useCallback } from "react";
import { getCurrencyOptions } from "../../utils/currencyUtils";
import { toast } from "sonner";

export const useCurrencyState = (defaultCurrency?: string) => {
  // Veritabanından gelen TRY değerlerini TL olarak normalize et
  const normalizedDefault = defaultCurrency === "TRY" ? "TL" : (defaultCurrency || "TL");
  const [selectedCurrency, setSelectedCurrency] = useState<string>(normalizedDefault);
  const currencyOptions = getCurrencyOptions();

  const handleCurrencyChange = useCallback((newCurrency: string) => {
    console.log(`Currency changed to ${newCurrency}`);
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
