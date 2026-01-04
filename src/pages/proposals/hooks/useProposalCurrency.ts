import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { normalizeCurrency } from "@/utils/formatters";
import { ProposalItem } from "@/types/proposal";

interface LineItem extends ProposalItem {
  row_number: number;
}

interface CurrencyConversionDialog {
  open: boolean;
  oldCurrency: string;
  newCurrency: string;
  oldRate?: number;
  newRate?: number;
  pendingValue?: any;
  pendingField?: string;
}

export const useProposalCurrency = (
  exchangeRatesMap: Record<string, number>,
  items: LineItem[],
  setItems: React.Dispatch<React.SetStateAction<LineItem[]>>,
  formCurrency: string,
  formExchangeRate?: number
) => {
  const prevCurrencyRef = useRef<string>(formCurrency);
  const prevExchangeRateRef = useRef<number | undefined>(formExchangeRate);
  
  const [currencyConversionDialog, setCurrencyConversionDialog] = useState<CurrencyConversionDialog>({
    open: false,
    oldCurrency: '',
    newCurrency: ''
  });

  // Currency conversion function
  const convertCurrency = useCallback((amount: number, fromCurrency: string, toCurrency: string): number => {
    const normalizedFrom = normalizeCurrency(fromCurrency);
    const normalizedTo = normalizeCurrency(toCurrency);
    
    if (normalizedFrom === normalizedTo) return amount;
    
    // Convert to TRY first (base currency)
    const amountInTRY = normalizedFrom === "TRY" 
      ? amount 
      : amount * (exchangeRatesMap[normalizedFrom] || 1);
    
    // Then convert from TRY to target currency
    const result = normalizedTo === "TRY" 
      ? amountInTRY 
      : amountInTRY / (exchangeRatesMap[normalizedTo] || 1);
    
    // Round to 4 decimal places
    return Math.round(result * 10000) / 10000;
  }, [exchangeRatesMap]);

  // Convert all items using a specific exchange rate
  const convertAllItemsWithRate = useCallback((fromCurrency: string, toCurrency: string, customRate?: number) => {
    setItems(prevItems => {
      return prevItems.map(item => {
        const itemCurrency = item.currency || fromCurrency;
        let convertedPrice: number;
        
        if (customRate && fromCurrency !== "TRY") {
          // Custom rate provided - use it for conversion from fromCurrency to TRY
          // First, convert item to TRY
          let amountInTRY: number;
          
          if (itemCurrency === "TRY") {
            // Item is already in TRY
            amountInTRY = item.unit_price;
          } else if (itemCurrency === fromCurrency) {
            // Item is in the same currency as fromCurrency, use custom rate
            amountInTRY = item.unit_price * customRate;
          } else {
            // Item is in a different currency, convert to TRY first using market rate
            const itemRate = exchangeRatesMap[itemCurrency] || 1;
            amountInTRY = item.unit_price * itemRate;
          }
          
          // Now convert from TRY to target currency
          if (toCurrency === "TRY") {
            convertedPrice = amountInTRY;
          } else {
            // Use market rate for target currency
            const targetRate = exchangeRatesMap[toCurrency] || 1;
            convertedPrice = amountInTRY / targetRate;
          }
        } else {
          // Use standard conversion
          convertedPrice = convertCurrency(item.unit_price, itemCurrency, toCurrency);
        }
        
        return {
          ...item,
          unit_price: convertedPrice,
          currency: toCurrency,
          total_price: item.quantity * convertedPrice
        };
      });
    });
  }, [convertCurrency, exchangeRatesMap, setItems]);

  // Handle currency conversion confirmation
  const handleCurrencyConversionConfirm = useCallback(() => {
    const { oldCurrency, newCurrency, oldRate, newRate, pendingValue, pendingField } = currencyConversionDialog;
    
    if (pendingField === 'currency') {
      // Currency change - convert all items using the old rate (custom or market)
      const marketRate = oldCurrency === "TRY" ? 1 : (exchangeRatesMap[oldCurrency] || 1);
      const isCustomRate = oldRate && oldRate !== marketRate;
      const rateToUse = oldRate || marketRate;
      
      // Convert all items using the custom rate if it's different from market rate
      convertAllItemsWithRate(oldCurrency, newCurrency, isCustomRate ? rateToUse : undefined);
      prevCurrencyRef.current = newCurrency;
      
      // Show success message with rate info
      if (oldCurrency !== "TRY" && isCustomRate && oldRate) {
        toast.success(`Tüm kalemler ${oldCurrency} (${oldRate.toFixed(4)} kurundan) ${newCurrency} para birimine dönüştürüldü`);
      } else {
        toast.success(`Tüm kalemler ${oldCurrency} para biriminden ${newCurrency} para birimine dönüştürüldü`);
      }
    } else if (pendingField === 'exchange_rate' && newRate) {
      // Exchange rate change - convert all items using the new rate
      convertAllItemsWithRate(oldCurrency, newCurrency, newRate);
      prevExchangeRateRef.current = newRate;
      toast.success(`Tüm kalemler yeni döviz kuru (${newRate.toFixed(4)}) ile dönüştürüldü`);
    }
    
    setCurrencyConversionDialog({ open: false, oldCurrency: '', newCurrency: '' });
  }, [currencyConversionDialog, convertAllItemsWithRate, exchangeRatesMap]);

  // Handle currency conversion cancellation
  const handleCurrencyConversionCancel = useCallback(() => {
    setCurrencyConversionDialog({ open: false, oldCurrency: '', newCurrency: '' });
  }, []);

  // Handle field change with currency conversion dialog
  const handleFieldChange = useCallback((field: string, value: any, formData: any, form: any, setFormData: any, setHasChanges: any) => {
    // Skip undefined values to prevent unnecessary updates
    if (value === undefined) {
      return;
    }
    
    // Handle currency change - show confirmation dialog
    if (field === 'currency' && value !== prevCurrencyRef.current) {
      const oldCurrency = prevCurrencyRef.current;
      const newCurrency = value;
      
      // Get exchange rates - use custom rate from input if available, otherwise use market rate
      const oldCustomRate = formData.exchange_rate;
      const oldMarketRate = oldCurrency === "TRY" ? 1 : (exchangeRatesMap[oldCurrency] || 1);
      const oldRate = oldCustomRate && oldCurrency !== "TRY" ? oldCustomRate : oldMarketRate;
      
      const newMarketRate = newCurrency === "TRY" ? 1 : (exchangeRatesMap[newCurrency] || 1);
      const newRate = newMarketRate; // New currency will use market rate initially
      
      setCurrencyConversionDialog({
        open: true,
        oldCurrency,
        newCurrency,
        oldRate,
        newRate,
        pendingValue: value,
        pendingField: field
      });
      return; // Don't update yet, wait for confirmation
    }
    
    // Handle exchange_rate change - just update, no dialog
    if (field === 'exchange_rate') {
      prevExchangeRateRef.current = value;
    }
    
    setFormData((prev: any) => ({
      ...prev,
      [field]: value
    }));
    
    // Also update form context for fields that are in the form
    if (field === 'customer_id') {
      form.setValue('customer_id', value);
    } else if (field === 'contact_name') {
      form.setValue('contact_name', value);
    } else if (field === 'prepared_by') {
      form.setValue('prepared_by', value);
    } else if (field === 'employee_id') {
      form.setValue('employee_id', value);
    }
    setHasChanges(true);
  }, [exchangeRatesMap]);

  return {
    convertCurrency,
    convertAllItemsWithRate,
    currencyConversionDialog,
    setCurrencyConversionDialog,
    handleCurrencyConversionConfirm,
    handleCurrencyConversionCancel,
    handleFieldChange,
    prevCurrencyRef,
    prevExchangeRateRef
  };
};

