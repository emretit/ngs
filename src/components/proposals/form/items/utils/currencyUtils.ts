
import { ExchangeRates, CurrencyOption } from "../types/currencyTypes";
import { supabase } from "@/integrations/supabase/client";

// Format a currency value for display
export const formatCurrencyValue = (amount: number, currency: string = "TRY"): string => {
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

// Fetch exchange rates from the database with better error handling
export const fetchTCMBExchangeRates = async (): Promise<ExchangeRates> => {
  try {
    // First try to get from the database
    const { data, error } = await supabase
      .from('exchange_rates')
      .select('*')
      .order('update_date', { ascending: false });
    
    if (error) {
      console.error("Database error:", error);
      throw new Error(`Database error: ${error.message}`);
    }
    
    if (data && data.length > 0) {
      // Transform the data into the expected format
      const rates: ExchangeRates = { TRY: 1 };
      const updateDate = data[0].update_date;
      
      data.forEach(rate => {
        if (rate.currency_code && rate.forex_buying) {
          rates[rate.currency_code] = rate.forex_buying;
        }
      });
      
      console.log(`Exchange rates fetched (${updateDate}):`, rates);
      return rates;
    }
    
    // If no data in database, try the edge function
    console.log("No rates in database, trying edge function");
    const { data: functionData, error: functionError } = await supabase.functions.invoke('fetch-exchange-rates', {
      method: 'GET'
    });
    
    if (functionError) {
      console.error("Function error:", functionError);
      throw new Error(`Function error: ${functionError.message}`);
    }
    
    if (functionData && functionData.data) {
      // Transform the function data into the expected format
      const rates: ExchangeRates = { TRY: 1 };
      functionData.data.forEach((rate: any) => {
        if (rate.currency_code && rate.forex_buying) {
          rates[rate.currency_code] = rate.forex_buying;
        }
      });
      
      console.log("Function Exchange rates fetched:", rates);
      return rates;
    }
    
    console.warn("No exchange rate data available, using fallback rates");
    throw new Error('No exchange rate data available');
  } catch (error) {
    console.error("Error fetching exchange rates:", error);
    // Return fallback exchange rates if API call fails
    return {
      TRY: 1,
      USD: 32.5,
      EUR: 35.2,
      GBP: 41.3
    };
  }
};

// Convert an amount from one currency to another
export const convertCurrency = (
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: ExchangeRates
): number => {
  // If currencies are the same, no conversion needed
  if (fromCurrency === toCurrency) return amount;
  
  // Handle TRY as the base currency 
  if (fromCurrency === "TRY") {
    return amount / (rates[toCurrency] || 1);
  }
  
  // Convert from source currency to TRY first, then to target currency
  const amountInTRY = amount * (rates[fromCurrency] || 1);
  return toCurrency === "TRY" ? amountInTRY : amountInTRY / (rates[toCurrency] || 1);
};

// Format a price with a specified number of decimal places
export const formatPrice = (price: number, decimals: number = 2): string => {
  return price.toFixed(decimals);
};

// Add currency symbol to a formatted price
export const addCurrencySymbol = (price: string, currency: string): string => {
  const symbols: Record<string, string> = {
    TRY: '₺',
    USD: '$',
    EUR: '€',
    GBP: '£'
  };
  
  return `${symbols[currency] || currency} ${price}`;
};

// Get currency symbol for a given currency code
export const getCurrencySymbol = (currency: string): string => {
  const symbols: Record<string, string> = {
    TRY: '₺',
    USD: '$',
    EUR: '€',
    GBP: '£'
  };
  
  return symbols[currency] || currency;
};

// Get currency options for dropdowns
export const getCurrencyOptions = (): CurrencyOption[] => {
  return [
    { value: "TRY", label: "₺ TRY", symbol: "₺" },
    { value: "USD", label: "$ USD", symbol: "$" },
    { value: "EUR", label: "€ EUR", symbol: "€" },
    { value: "GBP", label: "£ GBP", symbol: "£" }
  ];
};

// Get current exchange rates (for synchronous contexts)
export const getCurrentExchangeRates = (): ExchangeRates => {
  // Default rates (these will be replaced by API values when available)
  return {
    TRY: 1,
    USD: 32.5,
    EUR: 35.2,
    GBP: 41.3
  };
};

// Format exchange rate display
export const formatExchangeRate = (fromCurrency: string, toCurrency: string, rate: number): string => {
  return `1 ${fromCurrency} = ${rate.toFixed(2)} ${toCurrency}`;
};

// Calculate exchange rate between two currencies
export const calculateExchangeRate = (fromCurrency: string, toCurrency: string, rates: ExchangeRates): number => {
  if (fromCurrency === toCurrency) return 1;
  
  if (fromCurrency === 'TRY') {
    return 1 / (rates[toCurrency] || 1);
  }
  
  if (toCurrency === 'TRY') {
    return rates[fromCurrency] || 1;
  }
  
  // Cross-currency rate
  const fromRate = rates[fromCurrency] || 1;
  const toRate = rates[toCurrency] || 1;
  return fromRate / toRate;
};
