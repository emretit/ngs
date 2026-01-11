import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { showError } from "@/utils/toastUtils";
import { IntegratorService } from "@/services/integratorService";
import { supabase } from "@/integrations/supabase/client";

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
  invoiceType?: string;
  invoiceProfile?: string;
}

export const useIncomingInvoices = (dateFilters?: { startDate?: string; endDate?: string }, enabled = true) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Fast DB fetch - önce cache'den oku
  const fetchFromCache = async (): Promise<IncomingInvoice[]> => {
    try {
      // RLS policy otomatik olarak current_company_id() ile filtreler
      let query = supabase
        .from('einvoices_received')
        .select('*')
        .order('invoice_date', { ascending: false });

      if (dateFilters?.startDate) {
        query = query.gte('invoice_date', dateFilters.startDate);
      }
      if (dateFilters?.endDate) {
        query = query.lte('invoice_date', dateFilters.endDate);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Cache fetch error:', error);
        return [];
      }

      return (data || []).map(inv => ({
        id: inv.invoice_uuid || inv.id,
        invoiceNumber: inv.invoice_id || '',
        supplierName: inv.supplier_name || '',
        supplierTaxNumber: inv.supplier_vkn || '',
        invoiceDate: inv.invoice_date || '',
        dueDate: inv.due_date,
        totalAmount: parseFloat(inv.total_amount as any) || 0,
        paidAmount: 0,
        currency: inv.currency || 'TRY',
        taxAmount: parseFloat(inv.tax_amount as any) || 0,
        status: 'pending',
        isAnswered: false,
        xmlData: null,
        invoiceType: inv.invoice_type || 'TEMEL',
        invoiceProfile: inv.invoice_profile || 'TEMELFATURA',
      }));
    } catch (error) {
      console.error('Cache fetch error:', error);
      return [];
    }
  };

  // Sync from API - arka planda API'den yeni faturaları çek
  const syncFromApi = async (forceRefresh = false): Promise<IncomingInvoice[]> => {
    try {
      setIsSyncing(true);
      
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      const startDate = dateFilters?.startDate 
        ? `${dateFilters.startDate}T00:00:00.000Z` 
        : `${startOfMonth.toISOString().split('T')[0]}T00:00:00.000Z`;
      const endDate = dateFilters?.endDate 
        ? `${dateFilters.endDate}T23:59:59.999Z` 
        : `${endOfMonth.toISOString().split('T')[0]}T23:59:59.999Z`;
      
      const result = await IntegratorService.getIncomingInvoices({
        startDate,
        endDate,
        forceRefresh
      });

      if (!result.success) {
        throw new Error(result.error || 'Gelen faturalar alınamadı');
      }

      return result.invoices || [];
    } catch (error: any) {
      console.error('API sync error:', error);
      throw error;
    } finally {
      setIsSyncing(false);
    }
  };

  const fetchIncomingInvoices = async (): Promise<IncomingInvoice[]> => {
    try {
      setIsLoading(true);
      
      // Önce cache'den hızlıca oku
      const cachedInvoices = await fetchFromCache();
      
      // Eğer cache'de veri varsa, hemen döndür
      if (cachedInvoices.length > 0) {
        return cachedInvoices;
      }
      
      // Cache boşsa API'den çek
      return await syncFromApi(false);
      
    } catch (error: any) {
      console.error('Error fetching incoming invoices:', error);
      showError(error?.message || 'Gelen faturalar yüklenirken hata oluştu');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const { data: incomingInvoices = [], error, refetch, isLoading: queryLoading } = useQuery({
    queryKey: ['incoming-invoices', dateFilters?.startDate, dateFilters?.endDate],
    queryFn: fetchIncomingInvoices,
    enabled,
    retry: 1,
    retryDelay: 1000,
    staleTime: 10 * 60 * 1000, // 10 dakika cache
    gcTime: 30 * 60 * 1000, // 30 dakika memory'de tut
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    placeholderData: (previousData) => previousData,
  });

  // Force refresh - API'den yeni faturaları çek
  const forceRefresh = async () => {
    try {
      setIsLoading(true);
      await syncFromApi(true);
      await refetch();
    } catch (error: any) {
      showError(error?.message || 'Faturalar güncellenirken hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    incomingInvoices,
    isLoading: isLoading || queryLoading,
    isSyncing,
    error,
    refetch,
    forceRefresh,
  };
};