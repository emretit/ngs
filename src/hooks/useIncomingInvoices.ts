import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { showError } from "@/utils/toastUtils";
import { IntegratorService } from "@/services/integratorService";

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

  const fetchIncomingInvoices = async (): Promise<IncomingInvoice[]> => {
    try {
      setIsLoading(true);
      
      // Use provided date filters or default to current month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      const startDate = dateFilters?.startDate 
        ? `${dateFilters.startDate}T00:00:00.000Z` 
        : `${startOfMonth.toISOString().split('T')[0]}T00:00:00.000Z`;
      const endDate = dateFilters?.endDate 
        ? `${dateFilters.endDate}T23:59:59.999Z` 
        : `${endOfMonth.toISOString().split('T')[0]}T23:59:59.999Z`;
      
      // Use IntegratorService which automatically routes to correct integrator
      const result = await IntegratorService.getIncomingInvoices({
        startDate,
        endDate
      });

      if (!result.success) {
        throw new Error(result.error || 'Gelen faturalar alınamadı');
      }

      return result.invoices || [];
      
    } catch (error: any) {
      console.error('Error fetching incoming invoices:', error);
      
      // Extract more detailed error message
      let errorMessage = 'Gelen faturalar yüklenirken hata oluştu';
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.error) {
        errorMessage = error.error;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      // Show user-friendly error message
      showError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const { data: incomingInvoices = [], error, refetch, isLoading: queryLoading } = useQuery({
    queryKey: ['incoming-invoices', dateFilters?.startDate, dateFilters?.endDate],
    queryFn: fetchIncomingInvoices,
    enabled, // Hook'u koşullu olarak etkinleştir
    retry: 2,
    retryDelay: 2000,
    staleTime: 0, // Cache kullanma - her zaman fresh data çek
    gcTime: 5 * 60 * 1000, // 5 dakika cache'de tut (memory'den temizleme için)
    refetchOnWindowFocus: false, // Pencere odaklandığında refetch etme
    refetchOnMount: true, // Mount'ta refetch et (sayfa yüklenince çek)
    refetchOnReconnect: true, // Bağlantı yenilendiğinde refetch et
    placeholderData: (previousData) => previousData, // Önceki veriyi tut (smooth transition)
  });

  return {
    incomingInvoices,
    isLoading: isLoading || queryLoading, // Hem local hem query loading'i kontrol et
    error,
    refetch,
  };
};