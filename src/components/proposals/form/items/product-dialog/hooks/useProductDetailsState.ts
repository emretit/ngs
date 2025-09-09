
import { useState, useEffect } from "react";
import { Product } from "@/types/product";
import { fetchTCMBExchangeRates } from "../../utils/currencyUtils";

export const useProductDetailsState = (open: boolean, selectedProduct: Product | null, selectedCurrency: string) => {
  const [totalPrice, setTotalPrice] = useState(0);
  const [availableStock, setAvailableStock] = useState(0);
  const [stockStatus, setStockStatus] = useState("");
  const [convertedPrice, setConvertedPrice] = useState(0);
  const [notes, setNotes] = useState("");
  const [originalPrice, setOriginalPrice] = useState(0);
  const [originalCurrency, setOriginalCurrency] = useState("");
  const [currentCurrency, setCurrentCurrency] = useState(selectedCurrency);
  const [exchangeRates, setExchangeRates] = useState({
    TRY: 1,
    USD: 32.5,
    EUR: 35.2,
    GBP: 41.3
  });
  const [isLoadingRates, setIsLoadingRates] = useState(false);
  const [calculatedTotal, setCalculatedTotal] = useState(0);

  useEffect(() => {
    if (open) {
      const getExchangeRates = async () => {
        setIsLoadingRates(true);
        try {
          const rates = await fetchTCMBExchangeRates();
          const completeRates = {
            TRY: rates.TRY || 1,
            USD: rates.USD || 32.5,
            EUR: rates.EUR || 35.2,
            GBP: rates.GBP || 41.3
          };
          setExchangeRates(completeRates);
          console.log("Dialog Exchange rates loaded:", completeRates);
        } catch (error) {
          console.error("Error fetching exchange rates in dialog:", error);
        } finally {
          setIsLoadingRates(false);
        }
      };
      
      getExchangeRates();
    }
  }, [open]);

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
