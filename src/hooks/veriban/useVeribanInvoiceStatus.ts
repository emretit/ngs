import { useRef, useCallback, useEffect } from "react";
import { logger } from '@/utils/logger';
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

/**
 * Veriban e-fatura durum kontrol işlemleri
 * - Tekil durum kontrolü
 * - Retry mekanizması (exponential backoff)
 * - Transfer durumu takibi
 */
export const useVeribanInvoiceStatus = () => {
  const queryClient = useQueryClient();
  const retryTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Check invoice status (includes transfer status check automatically)
  const checkStatusMutation = useMutation({
    mutationFn: async (salesInvoiceId: string) => {
      logger.debug('🔄 [useVeribanInvoiceStatus] Durum kontrolü başlatılıyor:', salesInvoiceId);
      
      const { data, error } = await supabase.functions.invoke('veriban-invoice-status', {
        body: { 
          invoiceId: salesInvoiceId // Edge function 'invoiceId' bekliyor
        }
      });
      
      if (error) {
        logger.error('❌ [useVeribanInvoiceStatus] Edge function hatası:', error);
        // Error context'ten detaylı hata mesajını al
        let errorMessage = error.message || 'Bilinmeyen hata';
        if (error.context) {
          try {
            if (error.context instanceof Response) {
              const responseText = await error.context.text();
              logger.error('❌ [useVeribanInvoiceStatus] Response body:', responseText);
              try {
                const responseJson = JSON.parse(responseText);
                if (responseJson.error) {
                  errorMessage = responseJson.error;
                }
              } catch (e) {
                // Not JSON
              }
            }
          } catch (e) {
            logger.error('❌ [useVeribanInvoiceStatus] Hata mesajı okunamadı:', e);
          }
        }
        throw new Error(errorMessage);
      }
      
      // 202 (Accepted) - Transfer henüz tamamlanmamış veya transfer hatası
      if (data && !data.success) {
        if (data.transferStatus) {
          // Transfer durumu var - henüz işleniyor veya hata
          if (data.transferStatus.stateCode === 4) {
            // Transfer hatası
            throw new Error(data.error || data.message || 'Transfer hatası');
          } else {
            // Transfer henüz tamamlanmamış
            throw new Error(data.message || data.error || 'Fatura henüz işleniyor');
          }
        } else {
          // Diğer hatalar
          throw new Error(data.error || data.message || 'Durum kontrolü başarısız');
        }
      }
      
      logger.debug('✅ [useVeribanInvoiceStatus] Durum kontrolü başarılı:', data);
      logger.debug('📊 [useVeribanInvoiceStatus] Durum detayları:', {
        stateCode: data?.status?.stateCode,
        stateName: data?.status?.stateName,
        userFriendlyStatus: data?.status?.userFriendlyStatus,
        answerStatus: data?.status?.answerStatus,
        stateDescription: data?.status?.stateDescription,
      });
      return { success: data?.success || false, salesInvoiceId, status: data?.status };
    },
    onSuccess: (result) => {
      const { success, salesInvoiceId } = result;
      // Veritabanını her durumda yenile
      queryClient.invalidateQueries({ queryKey: ["einvoice-status", salesInvoiceId] });
      queryClient.invalidateQueries({ queryKey: ["salesInvoices"] });
    },
  });

  // Exponential backoff retry logic for status check
  // veriban-invoice-status edge function'ı otomatik olarak transfer durumunu kontrol ediyor
  // Eğer transfer tamamlanmamışsa 202 (Accepted) döner ve retry yapılır
  const checkStatusWithRetry = useCallback(async (
    salesInvoiceId: string, 
    attempt: number,
    maxAttempts: number = 10
  ) => {
    // Clear any existing timeout for this invoice
    const existingTimeout = retryTimeoutsRef.current.get(salesInvoiceId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    if (attempt >= maxAttempts) {
      logger.warn('⚠️ [useVeribanInvoiceStatus] Maksimum deneme sayısına ulaşıldı. Durum kontrol edilemedi.');
      toast.warning('Fatura işleniyor. Durum otomatik olarak güncellenecek.');
      return;
    }

    try {
      const result = await checkStatusMutation.mutateAsync(salesInvoiceId);
      
      logger.debug('✅ [useVeribanInvoiceStatus] Durum kontrolü başarılı');
      if (result.status) {
        logger.debug('📊 [useVeribanInvoiceStatus] Fatura durumu:', {
          stateCode: result.status.stateCode,
          durum: result.status.userFriendlyStatus,
          cevap: result.status.answerStatus || 'Henüz cevap yok',
        });
      }
      
      // Başarılı - işlem tamamlandı
      queryClient.invalidateQueries({ queryKey: ["einvoice-status", salesInvoiceId] });
      queryClient.invalidateQueries({ queryKey: ["salesInvoices"] });
      
    } catch (error: any) {
      logger.warn('⚠️ [useVeribanInvoiceStatus] Durum kontrolü hatası:', error);
      
      // 202 (Accepted) - Transfer henüz tamamlanmamış, retry yap
      if (error?.message?.includes('henüz') || error?.message?.includes('işleniyor') || error?.message?.includes('bekliyor')) {
        const waitTime = Math.min(30000 * Math.pow(2, attempt), 300000); // Max 5 dakika
        logger.debug(`⏳ [useVeribanInvoiceStatus] Fatura işleniyor, ${waitTime / 1000} saniye sonra tekrar kontrol edilecek (deneme ${attempt + 1}/${maxAttempts})...`);
        
        const timeout = setTimeout(() => {
          checkStatusWithRetry(salesInvoiceId, attempt + 1, maxAttempts);
        }, waitTime);
        
        retryTimeoutsRef.current.set(salesInvoiceId, timeout);
      } else if (error?.message?.includes('bulunamadı')) {
        // Fatura bulunamadı - henüz işlenmemiş olabilir, retry yap
        const waitTime = Math.min(30000 * Math.pow(2, attempt), 300000);
        logger.debug(`⏳ [useVeribanInvoiceStatus] Fatura henüz işlenmemiş, ${waitTime / 1000} saniye sonra tekrar kontrol edilecek (deneme ${attempt + 1}/${maxAttempts})...`);
        
        const timeout = setTimeout(() => {
          checkStatusWithRetry(salesInvoiceId, attempt + 1, maxAttempts);
        }, waitTime);
        
        retryTimeoutsRef.current.set(salesInvoiceId, timeout);
      } else if (error?.message?.includes('Transfer hatası') || error?.message?.includes('MODEL CREATE ERROR')) {
        // Transfer hatası - retry yapma, direkt hata göster
        logger.error('❌ [useVeribanInvoiceStatus] Transfer hatası:', error);
        toast.error(`Fatura gönderiminde hata: ${error.message}`);
        // Veritabanını güncelle
        queryClient.invalidateQueries({ queryKey: ["einvoice-status", salesInvoiceId] });
        queryClient.invalidateQueries({ queryKey: ["salesInvoices"] });
      } else {
        // Diğer hatalar - kritik değil, sadece logla
        logger.error('❌ [useVeribanInvoiceStatus] Durum kontrolü hatası:', error);
      }
    }
  }, [checkStatusMutation, queryClient]);

  // Wrapper function for checkStatus with optional silent mode
  const checkStatus = (salesInvoiceId: string, options?: { silent?: boolean; onSuccess?: () => void; onError?: (error: any) => void }) => {
    checkStatusMutation.mutate(salesInvoiceId, {
      onSuccess: (result) => {
        const { success, status } = result;
        if (!options?.silent) {
          if (success) {
            const statusMessage = status?.userFriendlyStatus || 'Durum kontrolü tamamlandı';
            const answerMessage = status?.answerStatus ? ` - ${status.answerStatus}` : '';
            toast.success(`${statusMessage}${answerMessage}`);
          } else {
            toast.error('Durum kontrolü başarısız');
          }
        }
        options?.onSuccess?.();
      },
      onError: (error) => {
        logger.error("Durum kontrolü hatası:", error);
        if (!options?.silent) {
          toast.error('Durum kontrolü yapılamadı');
        }
        options?.onError?.(error);
      }
    });
  };

  // Cleanup: Component unmount olduğunda tüm timeout'ları temizle
  useEffect(() => {
    return () => {
      // Tüm retry timeout'larını temizle
      retryTimeoutsRef.current.forEach((timeout, invoiceId) => {
        clearTimeout(timeout);
        logger.debug('🧹 [Cleanup] Retry timeout temizlendi:', invoiceId);
      });
      retryTimeoutsRef.current.clear();
    };
  }, []);

  return {
    // Actions
    checkStatus,
    checkStatusWithRetry,

    // States
    isCheckingStatus: checkStatusMutation.isPending,
  };
};
