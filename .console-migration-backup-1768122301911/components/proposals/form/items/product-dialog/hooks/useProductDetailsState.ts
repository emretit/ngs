
import { useState, useEffect } from "react";
import { Product } from "@/types/product";
import { useExchangeRates as useDashboardExchangeRates } from "@/hooks/useExchangeRates";

export const useProductDetailsState = (open: boolean, selectedProduct: Product | null, selectedCurrency: string) => {
  const [totalPrice, setTotalPrice] = useState(0);
  const [availableStock, setAvailableStock] = useState(0);
  const [stockStatus, setStockStatus] = useState("");
  const [convertedPrice, setConvertedPrice] = useState(0);
  const [notes, setNotes] = useState("");
  const [originalPrice, setOriginalPrice] = useState(0);
  const [originalCurrency, setOriginalCurrency] = useState("");
  const [currentCurrency, setCurrentCurrency] = useState(selectedCurrency);
  const dashboardRates = useDashboardExchangeRates();
  
  // Convert dashboard format to proposal format
  const exchangeRates = {
    TRY: 1,
    USD: dashboardRates.exchangeRates.find(rate => rate.currency_code === 'USD')?.forex_selling || 32.5,
    EUR: dashboardRates.exchangeRates.find(rate => rate.currency_code === 'EUR')?.forex_selling || 35.2,
    GBP: dashboardRates.exchangeRates.find(rate => rate.currency_code === 'GBP')?.forex_selling || 41.3
  };
  const isLoadingRates = dashboardRates.loading;
  const [calculatedTotal, setCalculatedTotal] = useState(0);

  // Exchange rates are now automatically loaded from dashboard

  const handleCurrencyChange = (value: string) => {
    console.log("Currency changed in dialog to:", value);
    setCurrentCurrency(value);
    window.dispatchEvent(new CustomEvent('currency-change', { detail: value }));
  };

  return {
    totalPrice,
    setTotalPrice,
    availableStock,
    setAvailableStock,
    stockStatus,
    setStockStatus,
    convertedPrice,
    setConvertedPrice,
    notes,
    setNotes,
    originalPrice,
    setOriginalPrice,
    originalCurrency,
    setOriginalCurrency,
    currentCurrency,
    setCurrentCurrency,
    exchangeRates,
    isLoadingRates,
    calculatedTotal,
    setCalculatedTotal,
    handleCurrencyChange
  };
};
