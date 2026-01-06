import { useState, useEffect } from 'react';
import { fetchSalesAnalysisData, MonthlySalesData, SalesAnalysisFilters } from '@/services/dashboard/salesAnalysisService';

export const useSalesAnalysis = (filters: SalesAnalysisFilters = { timePeriod: '6' }) => {
  const [data, setData] = useState<MonthlySalesData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await fetchSalesAnalysisData(filters);
        setData(result);
      } catch (err) {
        console.error('Error loading sales analysis data:', err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [filters.timePeriod, filters.startDate, filters.endDate]);

  return { data, isLoading, error };
};

