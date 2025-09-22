import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { showError } from "@/utils/toastUtils";

export interface IncomingInvoice {
  id: string;
  invoiceNumber: string;
  supplierName: string;
  supplierTaxNumber: string;
  invoiceDate: string;
  dueDate?: string;
  totalAmount: number;
  paidAmount: number;
  currency: string;
  taxAmount: number;
  status: string;
  responseStatus?: string;
  isAnswered: boolean;
  pdfUrl?: string;
  xmlData: any;
}

export const useIncomingInvoices = (dateFilters?: { startDate?: string; endDate?: string }) => {
  const [isLoading, setIsLoading] = useState(false);

  const fetchIncomingInvoices = async (): Promise<IncomingInvoice[]> => {
    try {
      setIsLoading(true);
      console.log('🔄 Starting fetchIncomingInvoices...');
      
      // Use provided date filters or default to 1 August - 1 September
      const startDate = dateFilters?.startDate ? `${dateFilters.startDate}T00:00:00.000Z` : '2025-08-01T00:00:00.000Z';
      const endDate = dateFilters?.endDate ? `${dateFilters.endDate}T23:59:59.999Z` : '2025-09-01T23:59:59.999Z';
      
      console.log('📅 Frontend sending date filters:', { startDate, endDate, fromProps: !!dateFilters });
      
      const { data, error } = await supabase.functions.invoke('nilvera-incoming-invoices', {
        body: { 
          filters: {
            startDate,
            endDate
          }
        }
      });

      console.log('📡 Supabase function response:', { data, error });

      if (error) {
        console.error('❌ Supabase function error:', error);
        throw new Error(error.message || 'Gelen faturalar alınamadı');
      }

      if (!data) {
        console.error('❌ No data received from function');
        throw new Error('Function response is empty');
      }

      if (!data.success) {
        console.error('❌ Function returned error:', data.error);
        throw new Error(data.error || 'Gelen faturalar alınamadı');
      }

      console.log('✅ Fetched incoming invoices count:', data.invoices?.length || 0);
      console.log('📊 First invoice sample:', data.invoices?.[0]);
      return data.invoices || [];
      
    } catch (error: any) {
      console.error('Error fetching incoming invoices:', error);
      showError(error.message || 'Gelen faturalar yüklenirken hata oluştu');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const { data: incomingInvoices = [], error, refetch } = useQuery({
    queryKey: ['incoming-invoices', dateFilters?.startDate, dateFilters?.endDate],
    queryFn: fetchIncomingInvoices,
    retry: 1,
    retryDelay: 1000,
    staleTime: 5 * 60 * 1000, // 5 dakika cache
    refetchOnWindowFocus: false, // Pencere odaklandığında refetch etme
  });

  return {
    incomingInvoices,
    isLoading,
    error,
    refetch,
  };
};