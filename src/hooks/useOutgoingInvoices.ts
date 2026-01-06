import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { showError } from "@/utils/toastUtils";
import { IntegratorService } from "@/services/integratorService";
import { supabase } from "@/integrations/supabase/client";

export interface OutgoingInvoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerTaxNumber: string;
  invoiceDate: string;
  dueDate?: string;
  totalAmount: number;
  taxAmount: number;
  taxExclusiveAmount: number;
  currency: string;
  status: string;
  sentAt?: string | null;
  deliveredAt?: string | null;
  invoiceType?: string;
  invoiceProfile?: string;
  invoiceUUID?: string;
}

export const useOutgoingInvoices = (dateFilters?: { startDate?: string; endDate?: string; customerTaxNumber?: string }, enabled = true) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Fast DB fetch - önce cache'den oku
  const fetchFromCache = async (): Promise<OutgoingInvoice[]> => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .single();

      if (!profile?.company_id) return [];

      let query = supabase
        .from('outgoing_invoices')
        .select('*')
        .eq('company_id', profile.company_id)
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
        id: inv.id,
        invoiceNumber: inv.invoice_number || '',
        customerName: inv.customer_name || '',
        customerTaxNumber: inv.customer_tax_number || '',
        invoiceDate: inv.invoice_date || '',
        dueDate: inv.due_date,
        totalAmount: parseFloat(inv.payable_amount as any) || 0,
        taxAmount: parseFloat(inv.tax_total_amount as any) || 0,
        taxExclusiveAmount: parseFloat(inv.tax_exclusive_amount as any) || 0,
        currency: inv.currency || 'TRY',
        status: inv.status || 'sent',
        sentAt: inv.sent_at,
        deliveredAt: inv.delivered_at,
        invoiceType: inv.invoice_type || 'TEMEL',
        invoiceProfile: inv.invoice_profile || 'TEMELFATURA',
        invoiceUUID: inv.ettn || inv.id,
      }));
    } catch (error) {
      console.error('Cache fetch error:', error);
      return [];
    }
  };

  // Sync from API - arka planda API'den yeni faturaları çek
  const syncFromApi = async (forceRefresh = false): Promise<OutgoingInvoice[]> => {
    try {
      // customerTaxNumber zorunlu kontrol
      if (!dateFilters?.customerTaxNumber || dateFilters.customerTaxNumber.length < 10) {
        throw new Error('Giden faturalar için müşteri VKN zorunludur (10-11 haneli)');
      }

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
      
      console.log('🔄 Giden faturalar API sync başlatılıyor:', { startDate, endDate, customerTaxNumber: dateFilters.customerTaxNumber, forceRefresh });
      
      const result = await IntegratorService.getOutgoingInvoices({
        startDate,
        endDate,
        forceRefresh,
        customerTaxNumber: dateFilters?.customerTaxNumber
      });

      console.log('📊 API sync sonucu:', { success: result.success, invoiceCount: result.invoices?.length, error: result.error });

      if (!result.success) {
        throw new Error(result.error || 'Giden faturalar alınamadı');
      }

      return result.invoices || [];
    } catch (error: any) {
      console.error('❌ API sync error:', error);
      throw error;
    } finally {
      setIsSyncing(false);
    }
  };

  const fetchOutgoingInvoices = async (): Promise<OutgoingInvoice[]> => {
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
      console.error('Error fetching outgoing invoices:', error);
      showError(error?.message || 'Giden faturalar yüklenirken hata oluştu');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const { data: outgoingInvoices = [], error, refetch, isLoading: queryLoading } = useQuery({
    queryKey: ['outgoing-invoices', dateFilters?.startDate, dateFilters?.endDate, dateFilters?.customerTaxNumber],
    queryFn: fetchOutgoingInvoices,
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
    outgoingInvoices,
    isLoading: isLoading || queryLoading,
    isSyncing,
    error,
    refetch,
    forceRefresh,
  };
};