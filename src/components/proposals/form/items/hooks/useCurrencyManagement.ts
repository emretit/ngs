
import { useExchangeRates } from "./currency/useExchangeRates";
import { useCurrencyFormatter } from "./currency/useCurrencyFormatter";
import { useCurrencyConverter } from "./currency/useCurrencyConverter";
import { useCurrencyState } from "./currency/useCurrencyState";
import { useMemo } from "react";
import { Product } from "@/types/product";

export const useCurrencyManagement = (defaultCurrency?: string, product?: Product | null, isManualPriceEdit?: boolean) => {
  const { exchangeRates, isLoadingRates } = useExchangeRates();
  const { formatCurrency, getCurrencySymbol } = useCurrencyFormatter();
  const { convertAmount } = useCurrencyConverter(exchangeRates);
  const { 
    selectedCurrency, 
    setSelectedCurrency, 
    currencyOptions, 
    handleCurrencyChange 
  } = useCurrencyState(defaultCurrency);

  // Get original currency and price from product
  const originalCurrency = product?.currency || defaultCurrency || "TRY";
  const originalPrice = product?.price || 0;

  // Memoize the return object to prevent unnecessary re-renders
  const currencyManagement = useMemo(() => ({
    selectedCurrency,
    setSelectedCurrency,
    exchangeRates,
    currencyOptions,
    formatCurrency,
    getCurrencySymbol,
    handleCurrencyChange,
    convertAmount,
    isLoadingRates,
    originalCurrency,
    originalPrice
  }), [
    selectedCurrency,
    setSelectedCurrency,
    exchangeRates,
    currencyOptions,
    formatCurrency,
    getCurrencySymbol,
    handleCurrencyChange,
    convertAmount,
    isLoadingRates,
    originalCurrency,
    originalPrice
  ]);

  return currencyManagement;
};
