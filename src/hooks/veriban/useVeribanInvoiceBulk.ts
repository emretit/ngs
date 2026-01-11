import { useCallback } from "react";
import { logger } from '@/utils/logger';
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

/**
 * Veriban e-fatura toplu işlemleri
 * - Tüm faturaların durum sorgulaması
 * - Paralel durum güncellemeleri
 */
export const useVeribanInvoiceBulk = () => {
  const queryClient = useQueryClient();

  // Toplu durum sorgulama: Tüm faturaların durumunu kontrol et
  const refreshAllInvoiceStatuses = useCallback(async () => {
    try {
      logger.debug('🔄 [BulkStatusRefresh] Başlatılıyor...');
      toast.loading('Fatura durumları güncelleniyor...', { id: 'bulk-refresh' });

      // Tüm faturaları al (fatura_no olan)
      const { data: invoices, error } = await supabase
        .from('sales_invoices')
        .select('id, fatura_no, einvoice_status')
        .not('fatura_no', 'is', null)
        .order('created_at', { ascending: false })
        .limit(50); // Son 50 fatura

      if (error) {
        throw error;
      }

      if (!invoices || invoices.length === 0) {
        toast.info('Sorgulanacak fatura bulunamadı', { id: 'bulk-refresh' });
        return;
      }

      logger.debug(`📊 [BulkStatusRefresh] ${invoices.length} fatura bulundu`);

      let successCount = 0;
      let errorCount = 0;

      // Her fatura için durum sorgula (paralel olarak)
      const promises = invoices.map(async (invoice) => {
        try {
          const { data, error: statusError } = await supabase.functions.invoke('veriban-invoice-status', {
            body: { 
              invoiceId: invoice.id,        // ← invoiceId ekledik (veritabanı güncellemesi için gerekli)
              invoiceNumber: invoice.fatura_no
            }
          });

          if (statusError) {
            logger.error(`❌ [BulkStatusRefresh] ${invoice.fatura_no} hatası:`, statusError);
            errorCount++;
          } else if (data?.success) {
            logger.debug(`✅ [BulkStatusRefresh] ${invoice.fatura_no} güncellendi:`, data.status?.userFriendlyStatus);
            successCount++;
          } else {
            errorCount++;
          }
        } catch (err) {
          logger.error(`❌ [BulkStatusRefresh] ${invoice.fatura_no} hatası:`, err);
          errorCount++;
        }
      });

      // Tüm sorguların bitmesini bekle
      await Promise.all(promises);

      logger.debug(`✅ [BulkStatusRefresh] Tamamlandı: ${successCount} başarılı, ${errorCount} hata`);

      // Listeyi yenile - tüm query'leri agresif şekilde yenile
      await queryClient.invalidateQueries({ queryKey: ["salesInvoices"] });
      await queryClient.invalidateQueries({ queryKey: ["einvoice-status"] });
      await queryClient.refetchQueries({ queryKey: ["salesInvoices"] });

      // Tüm componentleri güncelle
      window.dispatchEvent(new CustomEvent('einvoice-status-bulk-updated'));

      toast.success(`${successCount} fatura durumu güncellendi`, { id: 'bulk-refresh' });

    } catch (error: any) {
      logger.error('❌ [BulkStatusRefresh] Hata:', error);
      toast.error('Fatura durumları güncellenirken hata oluştu', { id: 'bulk-refresh' });
    }
  }, [queryClient]);

  return {
    // Actions
    refreshAllInvoiceStatuses,
  };
};
