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

export const useIncomingInvoices = () => {
  const [isLoading, setIsLoading] = useState(false);

  const fetchIncomingInvoices = async (): Promise<IncomingInvoice[]> => {
    try {
      setIsLoading(true);
      console.log('🔄 Starting fetchIncomingInvoices...');
      
      const { data, error } = await supabase.functions.invoke('nilvera-invoices', {
        body: { action: 'fetch_incoming' }
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
    queryKey: ['incoming-invoices'],
    queryFn: fetchIncomingInvoices,
    retry: 1,
    retryDelay: 1000,
  });

  return {
    incomingInvoices,
    isLoading,
    error,
    refetch,
  };
};