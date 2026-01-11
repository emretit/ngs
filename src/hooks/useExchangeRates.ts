import { useCallback, useMemo } from "react";
import { logger } from '@/utils/logger';
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ExchangeRate {
  id?: string;
  currency_code: string;
  forex_buying: number | null;
  forex_selling: number | null;
  banknote_buying: number | null;
  banknote_selling: number | null;
  cross_rate: number | null;
  update_date: string;
}

// Fallback exchange rates when API fails
const fallbackRates: ExchangeRate[] = [
  {
    id: "fallback-try",
    currency_code: "TRY",
    forex_buying: 1,
    forex_selling: 1,
    banknote_buying: 1,
    banknote_selling: 1,
    cross_rate: null,
    update_date: new Date().toISOString().split('T')[0]
  },
  {
    id: "fallback-usd",
    currency_code: "USD",
    forex_buying: 41.395,
    forex_selling: 41.4695,
    banknote_buying: 41.366,
    banknote_selling: 41.5317,
    cross_rate: 1,
    update_date: new Date().toISOString().split('T')[0]
  },
  {
    id: "fallback-eur",
    currency_code: "EUR",
    forex_buying: 48.607,
    forex_selling: 48.6946,
    banknote_buying: 48.573,
    banknote_selling: 48.7676,
    cross_rate: 1.17,
    update_date: new Date().toISOString().split('T')[0]
  },
  {
    id: "fallback-gbp",
    currency_code: "GBP",
    forex_buying: 55.5629,
    forex_selling: 55.8526,
    banknote_buying: 55.524,
    banknote_selling: 55.9363,
    cross_rate: 1.35,
    update_date: new Date().toISOString().split('T')[0]
  }
];

// Keep only the latest update_date entries and dedupe by currency_code
const normalizeLatestRates = (rates: ExchangeRate[]): { list: ExchangeRate[]; latestDate: string | null } => {
  if (!rates?.length) return { list: [], latestDate: null };
  const latestDate = rates.reduce((max, r) => (r.update_date > max ? r.update_date : max), rates[0].update_date);
  const forLatest = rates.filter(r => r.update_date === latestDate);
  const seen = new Set<string>();
  const deduped: ExchangeRate[] = [];
  
  // Priority order: USD, EUR, GBP first, then others
  const priorityCurrencies = ['USD', 'EUR', 'GBP'];
  const otherCurrencies = forLatest.filter(r => !priorityCurrencies.includes(r.currency_code));
  
  // Add priority currencies first
  for (const currency of priorityCurrencies) {
    const rate = forLatest.find(r => r.currency_code === currency);
    if (rate && !seen.has(rate.currency_code)) {
      seen.add(rate.currency_code);
      deduped.push(rate);
    }
  }
  
  // Add other currencies
  for (const r of otherCurrencies) {
    if (!seen.has(r.currency_code)) {
      seen.add(r.currency_code);
      deduped.push(r);
    }
  }
  
  return { list: deduped, latestDate };
};

// Fetch exchange rates from database
const fetchExchangeRatesFromDB = async (): Promise<ExchangeRate[]> => {
  const { data, error } = await supabase
    .from('exchange_rates')
    .select('id, currency_code, forex_buying, forex_selling, banknote_buying, banknote_selling, cross_rate, update_date')
    .order('update_date', { ascending: false });
    
  if (error) throw error;
  return data || [];
};

// Trigger edge function to fetch fresh rates
const fetchFreshRates = async (): Promise<ExchangeRate[]> => {
  const { data, error } = await supabase.functions.invoke('exchange-rates', {
    method: 'POST'
  });
  
  if (error) throw error;
  return data?.rates || [];
};

export const useExchangeRates = () => {
  // Use React Query for better caching and state management
  const { data, isLoading: loading, error, refetch } = useQuery({
    queryKey: ['exchange-rates'],
    queryFn: async () => {
      // First try to get from database
      const dbRates = await fetchExchangeRatesFromDB();
      
      if (dbRates.length > 0) {
        return normalizeLatestRates(dbRates);
      }
      
      // If no data in database, try to fetch fresh rates
      const freshRates = await fetchFreshRates();
      if (freshRates.length > 0) {
        return normalizeLatestRates(freshRates);
      }
      
      // Fallback
      return normalizeLatestRates(fallbackRates);
    },
    staleTime: 30 * 60 * 1000, // 30 minutes - rates update once daily
    gcTime: 60 * 60 * 1000, // 1 hour in cache
    retry: 2,
    refetchOnWindowFocus: false,
    placeholderData: { list: fallbackRates, latestDate: fallbackRates[0].update_date },
  });

  const exchangeRates = data?.list || fallbackRates;
  const lastUpdate = data?.latestDate || null;

  // Function to manually refresh exchange rates
  const refreshExchangeRates = useCallback(async () => {
    toast.info('Döviz kurları güncelleniyor...', { duration: 2000 });
    
    try {
      const freshRates = await fetchFreshRates();
      
      if (freshRates.length > 0) {
        // Refetch to update cache
        await refetch();
        toast.success('Döviz kurları başarıyla güncellendi', {
          description: `${freshRates.length} adet kur bilgisi alındı.`,
        });
        return;
      }
      
      toast.warning('Varsayılan kurlar kullanılıyor', {
        description: 'Güncel kurlar alınamadı, geçici referans değerler kullanılıyor.',
      });
    } catch (err) {
      logger.error("Error refreshing exchange rates:", err);
      toast.error('Döviz kurları güncelleme hatası', {
        description: err instanceof Error ? err.message : 'Bilinmeyen hata',
      });
    }
  }, [refetch]);

  // Memoized rates map for currency calculations
  const ratesMap = useMemo(() => {
    const map: Record<string, number> = { TRY: 1 };
    exchangeRates.forEach(rate => {
      if (rate.currency_code && rate.forex_selling) {
        map[rate.currency_code] = rate.forex_selling;
      }
    });
    return map;
  }, [exchangeRates]);

  // Get rates map function (for backward compatibility)
  const getRatesMap = useCallback(() => ratesMap, [ratesMap]);

  // Convert amount between currencies
  const convertCurrency = useCallback((amount: number, fromCurrency: string, toCurrency: string): number => {
    if (fromCurrency === toCurrency) return amount;
    
    // If converting FROM foreign currency TO TRY
    if (toCurrency === 'TRY') {
      const rate = ratesMap[fromCurrency] || 1;
      return amount * rate;
    }
    
    // If converting FROM TRY TO foreign currency
    if (fromCurrency === 'TRY') {
      const rate = ratesMap[toCurrency] || 1;
      return amount / rate;
    }
    
    // If converting between two foreign currencies, go through TRY
    const amountInTRY = amount * (ratesMap[fromCurrency] || 1);
    return amountInTRY / (ratesMap[toCurrency] || 1);
  }, [ratesMap]);

  // Format currency with proper symbol
  const formatCurrency = useCallback((amount: number, currencyCode = 'TRY'): string => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: currencyCode
    }).format(amount);
  }, []);

  return {
    exchangeRates,
    loading,
    error: error as Error | null,
    lastUpdate,
    refreshExchangeRates,
    getRatesMap,
    convertCurrency,
    formatCurrency
  };
};
