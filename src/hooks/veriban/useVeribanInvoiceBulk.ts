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

      // Tüm faturaları al (fatura_no olan) - invoice_profile ve fatura_tipi2 de gerekli
      const { data: invoices, error } = await supabase
        .from('sales_invoices')
        .select('id, fatura_no, einvoice_status, invoice_profile, fatura_tipi2')
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
          // E-Arşiv fatura kontrolü
          const isEArchive = invoice.invoice_profile === 'EARSIVFATURA' || invoice.fatura_tipi2 === 'e-arşiv';
          
          // Fatura tipine göre doğru edge function'ı seç
          const functionName = isEArchive ? 'veriban-earchive-status' : 'veriban-invoice-status';
          
          logger.debug(`📋 [BulkStatusRefresh] ${invoice.fatura_no} sorgulanıyor (${isEArchive ? 'E-Arşiv' : 'E-Fatura'})...`);
          
          const { data, error: statusError } = await supabase.functions.invoke(functionName, {
            body: { 
              invoiceId: invoice.id,        // ← invoiceId ekledik (veritabanı güncellemesi için gerekli)
              invoiceNumber: invoice.fatura_no
            }
          });

          if (statusError) {
            logger.error(`❌ [BulkStatusRefresh] ${invoice.fatura_no} hatası:`, statusError);
            errorCount++;
          } else if (data?.success) {
            // Response formatı farklı olabilir (earchive-status: status, invoice-status: status)
            const statusInfo = data.status?.userFriendlyStatus || data.status?.stateName || 'Güncellendi';
            logger.debug(`✅ [BulkStatusRefresh] ${invoice.fatura_no} güncellendi:`, statusInfo);
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
