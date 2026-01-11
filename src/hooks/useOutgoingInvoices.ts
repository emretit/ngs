import { useState } from "react";
import { logger } from '@/utils/logger';
import { useQuery } from "@tanstack/react-query";
import { showError } from "@/utils/toastUtils";
import { IntegratorService } from "@/services/integratorService";
import { supabase } from "@/integrations/supabase/client";
// outgoingInvoiceSyncService import'u kaldırıldı - artık otomatik sync yok

export interface OutgoingInvoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerTaxNumber: string;
  customerTaxOffice?: string;
  supplierName?: string;
  supplierTaxNumber?: string;
  invoiceDate: string;
  invoiceTime?: string;
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
  xmlContent?: string;
  paymentMeansCode?: string;
  payeeIban?: string;
  payeeBankName?: string;
  // Veriban durum bilgileri
  elogoStatus?: number | null;        // Veriban StateCode (0-7)
  elogoCode?: number | null;          // Veriban AnswerStateCode (0-3)
  elogoDescription?: string | null;   // Durum açıklaması
  answerType?: string | null;         // KABUL/RED/IADE
  isAnswered?: boolean;               // Cevap verildi mi?
}

export const useOutgoingInvoices = (dateFilters?: { startDate?: string; endDate?: string; customerTaxNumber?: string }, enabled = true) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Fast DB fetch - önce cache'den oku
  const fetchFromCache = async (): Promise<OutgoingInvoice[]> => {
    try {
      // ✅ RLS policy otomatik olarak current_company_id() ile filtreler
      let query = supabase
        .from('outgoing_invoices')
        .select('*')
        .order('invoice_number', { ascending: false });

      if (dateFilters?.startDate) {
        query = query.gte('invoice_date', dateFilters.startDate);
      }
      if (dateFilters?.endDate) {
        query = query.lte('invoice_date', dateFilters.endDate);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Cache fetch error:', error);
        return [];
      }

      return (data || []).map(inv => ({
        id: inv.id,
        invoiceNumber: inv.invoice_number || '',
        customerName: inv.customer_name || '',
        customerTaxNumber: inv.customer_tax_number || '',
        customerTaxOffice: inv.customer_tax_office || '',
        supplierName: inv.supplier_name || '',
        supplierTaxNumber: inv.supplier_tax_number || '',
        invoiceDate: inv.invoice_date || '',
        invoiceTime: inv.invoice_time || '',
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
        xmlContent: inv.xml_content,
        paymentMeansCode: inv.payment_means_code || '',
        payeeIban: inv.payee_iban || '',
        payeeBankName: inv.payee_bank_name || '',
        // Veriban durum bilgileri
        elogoStatus: inv.elogo_status,
        elogoCode: inv.elogo_code,
        elogoDescription: inv.elogo_description,
        answerType: inv.answer_type,
        isAnswered: inv.is_answered || false,
      }));
    } catch (error) {
      logger.error('Cache fetch error:', error);
      return [];
    }
  };

  // Sync from API - arka planda API'den yeni faturaları çek
  const syncFromApi = async (forceRefresh = false): Promise<OutgoingInvoice[]> => {
    try {
      // Veriban API customerRegisterNumber parametresini zorunlu tutuyor
      if (!dateFilters?.customerTaxNumber || dateFilters.customerTaxNumber.length < 10) {
        throw new Error('Veriban API için müşteri VKN zorunludur. Lütfen dropdown\'dan bir müşteri seçin.');
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
      
      logger.debug('🔄 Giden faturalar API sync başlatılıyor:', { startDate, endDate, customerTaxNumber: dateFilters.customerTaxNumber, forceRefresh });
      
      const result = await IntegratorService.getOutgoingInvoices({
        startDate,
        endDate,
        forceRefresh,
        customerTaxNumber: dateFilters?.customerTaxNumber
      });

      logger.debug('📊 API sync sonucu:', { success: result.success, invoiceCount: result.invoices?.length, error: result.error });

      if (!result.success) {
        throw new Error(result.error || 'Giden faturalar alınamadı');
      }

      // ❌ Otomatik senkronizasyon KALDIRILDI
      // Kullanıcı manuel olarak ProcessOutgoingInvoices sayfasından seçip ekleyebilir
      // if (result.invoices && result.invoices.length > 0) {
      //   try {
      //     logger.debug('🔄 [useOutgoingInvoices] Sales invoices senkronizasyonu başlatılıyor...');
      //     const syncResult = await outgoingInvoiceSyncService.syncToSalesInvoices(result.invoices);
      //     logger.debug('✅ [useOutgoingInvoices] Senkronizasyon tamamlandı:', syncResult);
      //   } catch (syncError: any) {
      //     logger.error('⚠️ [useOutgoingInvoices] Senkronizasyon hatası:', syncError.message);
      //   }
      // }

      return result.invoices || [];
    } catch (error: any) {
      logger.error('❌ API sync error:', error);
      throw error;
    } finally {
      setIsSyncing(false);
    }
  };

  const fetchOutgoingInvoices = async (): Promise<OutgoingInvoice[]> => {
    try {
      setIsLoading(true);
      
      // VKN yoksa sadece cache'den oku
      if (!dateFilters?.customerTaxNumber || dateFilters.customerTaxNumber.length < 10) {
        logger.debug('⚠️ VKN yok - sadece cache görüntüleniyor');
        return await fetchFromCache();
      }
      
      // 1. Önce cache'den hızlıca oku ve göster
      const cachedInvoices = await fetchFromCache();
      
      // Cache'de veri varsa hemen döndür, arka planda sync devam eder
      if (cachedInvoices.length > 0) {
        setIsLoading(false);
        
        // Arka planda API'den senkronize et (non-blocking)
        syncFromApi(false).catch(error => {
          logger.error('Background sync error:', error);
        });
        
        return cachedInvoices;
      }
      
      // Cache boşsa API'den çek ve bekle
      return await syncFromApi(false);
      
    } catch (error: any) {
      logger.error('Error fetching outgoing invoices:', error);
      showError(error?.message || 'Giden faturalar yüklenirken hata oluştu');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const { data: outgoingInvoices = [], error, refetch, isLoading: queryLoading } = useQuery({
    queryKey: ['outgoing-invoices', dateFilters?.startDate, dateFilters?.endDate],
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