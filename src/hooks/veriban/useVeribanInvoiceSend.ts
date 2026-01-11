import { useState, useCallback } from "react";
import { logger } from '@/utils/logger';
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";

interface ConfirmDialog {
  open: boolean;
  invoiceId: string | null;
  currentStatus: {
    stateCode: number;
    stateName: string;
    userFriendlyStatus: string;
  } | null;
}

/**
 * Veriban e-fatura gönderim işlemleri
 * - Fatura gönderimi
 * - Tekrar gönderim onay dialogu
 * - Durum güncellemeleri
 */
export const useVeribanInvoiceSend = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialog>({
    open: false,
    invoiceId: null,
    currentStatus: null
  });

  // Send invoice to Veriban
  const sendInvoiceMutation = useMutation({
    mutationFn: async ({ 
      salesInvoiceId, 
      forceResend = false 
    }: { 
      salesInvoiceId: string; 
      forceResend?: boolean 
    }) => {
      logger.debug('🚀 [useVeribanInvoiceSend] Sending invoice to Veriban:', salesInvoiceId, 'forceResend:', forceResend);
      
      // GÖNDERİM BAŞLARKEN HEMEN DURUMU GÜNCELLE
      // Bu sayede kullanıcı arayüzde hemen değişikliği görür
      try {
        const { error: updateError } = await supabase
          .from('sales_invoices')
          .update({ 
            einvoice_status: 'sending', // Gönderiliyor durumuna çek
            elogo_status: 3, // StateCode 3 = Gönderim listesinde
            durum: 'gonderildi' // Fatura durumu da "gönderildi" olsun
          })
          .eq('id', salesInvoiceId);
        
        if (updateError) {
          logger.error('⚠️ [useVeribanInvoiceSend] Durum güncelleme hatası:', updateError);
        } else {
          logger.debug('✅ [useVeribanInvoiceSend] Fatura durumu "sending" (StateCode=3) olarak güncellendi');
          // Hemen query'leri yenile
          queryClient.invalidateQueries({ queryKey: ["salesInvoices"] });
          queryClient.invalidateQueries({ queryKey: ["einvoice-status", salesInvoiceId] });
        }
      } catch (err) {
        logger.error('⚠️ [useVeribanInvoiceSend] Durum güncelleme hatası:', err);
      }
      
      // Create a timeout promise (30 seconds)
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Fatura gönderimi zaman aşımına uğradı. İşlem çok uzun sürüyor. Lütfen durumu kontrol edin.'));
        }, 30000); // 30 saniye
      });
      
      // Race between the function call and timeout
      const invokePromise = supabase.functions.invoke('veriban-send-invoice', {
        body: { 
          invoiceId: salesInvoiceId,
          isDirectSend: true, // Direkt GİB'e gönder
          forceResend: forceResend, // Kullanıcı onayı ile zorla tekrar gönder
        }
      });
      
      const result = await Promise.race([
        invokePromise,
        timeoutPromise
      ]);
      
      const { data, error } = result;
      
      if (error) {
        logger.error('❌ [useVeribanInvoiceSend] Edge function error:', error);
        logger.error('❌ [useVeribanInvoiceSend] Error context:', error.context);
        
        // Try to extract error message from response body
        let errorMessage = error.message || 'Bilinmeyen hata';
        
        if (error.context) {
          try {
            // Try to get response body if available
            if (error.context instanceof Response) {
              const responseText = await error.context.text();
              logger.error('❌ [useVeribanInvoiceSend] Response body:', responseText);
              try {
                const responseJson = JSON.parse(responseText);
                if (responseJson.error) {
                  errorMessage = responseJson.error;
                }
                // Check for confirmation needed
                if (responseJson.needsConfirmation) {
                  throw {
                    message: 'NEEDS_CONFIRMATION',
                    needsConfirmation: true,
                    currentStatus: responseJson.currentStatus
                  };
                }
              } catch (e) {
                // If it's the NEEDS_CONFIRMATION error, re-throw it
                if ((e as any).message === 'NEEDS_CONFIRMATION') {
                  throw e;
                }
                // Not JSON, use text as is
                if (responseText) {
                  errorMessage = responseText;
                }
              }
            } else if (error.context.body?.error) {
              errorMessage = error.context.body.error;
              // Check for confirmation needed in context
              if (error.context.body?.needsConfirmation) {
                throw {
                  message: 'NEEDS_CONFIRMATION',
                  needsConfirmation: true,
                  currentStatus: error.context.body.currentStatus
                };
              }
            }
          } catch (e) {
            // If it's the NEEDS_CONFIRMATION error, re-throw it
            if ((e as any).message === 'NEEDS_CONFIRMATION') {
              throw e;
            }
            logger.error('❌ [useVeribanInvoiceSend] Could not read response body:', e);
          }
        }
        
        // Handle specific error cases
        if (errorMessage.includes('409') || errorMessage.includes('zaten')) {
          throw new Error('Bu fatura zaten gönderiliyor veya gönderilmiş. Lütfen birkaç dakika bekleyin.');
        } else if (errorMessage.includes('401') || errorMessage.includes('kimlik doğrulama')) {
          throw new Error('Veriban kimlik doğrulama hatası. Lütfen ayarlarınızı kontrol edin.');
        } else if (errorMessage.includes('404') || errorMessage.includes('bulunamadı')) {
          throw new Error(errorMessage.includes('Fatura') ? 'Fatura bulunamadı.' : errorMessage);
        } else if (errorMessage.includes('veri bulunamadı') || errorMessage.includes('kimlik doğrulama bilgileri')) {
          throw new Error('Veriban kimlik doğrulama bilgileri bulunamadı. Lütfen ayarlar sayfasından Veriban bilgilerinizi girin.');
        } else if (errorMessage.includes('zaman aşımı')) {
          throw new Error('Fatura gönderimi zaman aşımına uğradı. İşlem çok uzun sürüyor. Lütfen durumu kontrol edin.');
        } else if (errorMessage.includes('vergi numarası')) {
          throw new Error(errorMessage);
        } else {
          // Return the actual error message from edge function
          throw new Error(errorMessage);
        }
      }
      
      // Check if response data indicates confirmation needed
      if (data?.needsConfirmation) {
        throw {
          message: 'NEEDS_CONFIRMATION',
          needsConfirmation: true,
          currentStatus: data.currentStatus
        };
      }
      
      logger.debug('✅ [useVeribanInvoiceSend] Response:', data);
      return data;
    },
    onSuccess: async (data, { salesInvoiceId }) => {
      logger.debug("🎯 Veriban e-fatura gönderim cevabı:", data);
      
      if (data?.success) {
        // Başarılı gönderimde durumu 'sent' olarak güncelle
        try {
          const { error: updateError } = await supabase
            .from('sales_invoices')
            .update({ 
              einvoice_status: 'sent', // GİB'e gönderildi
              elogo_status: 2, // StateCode 2 = İmza bekliyor / GİB'e iletilmeyi bekliyor
              durum: 'gonderildi'
            })
            .eq('id', salesInvoiceId);
          
          if (updateError) {
            logger.error('⚠️ [useVeribanInvoiceSend] Başarılı gönderim sonrası durum güncelleme hatası:', updateError);
          } else {
            logger.debug('✅ [useVeribanInvoiceSend] Fatura durumu "sent" (StateCode=2) olarak güncellendi');
          }
        } catch (err) {
          logger.error('⚠️ [useVeribanInvoiceSend] Başarılı gönderim sonrası durum güncelleme hatası:', err);
        }
        
        toast.success('E-fatura başarıyla Veriban sistemine gönderildi');
        // E-fatura durumunu ve satış faturaları listesini yenile
        queryClient.invalidateQueries({ queryKey: ["einvoice-status", salesInvoiceId] });
        queryClient.invalidateQueries({ queryKey: ["salesInvoices"] });
        
        // Force refresh of EInvoiceStatus components
        window.dispatchEvent(new CustomEvent('einvoice-status-updated', {
          detail: { salesInvoiceId, status: 'sent' }
        }));
      } else {
        toast.error(data?.error || data?.message || 'E-fatura gönderilemedi');
        // Hata durumunda durumu 'error' olarak güncelle
        try {
          await supabase
            .from('sales_invoices')
            .update({ 
              einvoice_status: 'error',
              elogo_status: 4, // StateCode 4 = Hatalı
              einvoice_error_message: data?.error || data?.message || 'E-fatura gönderilemedi'
            })
            .eq('id', salesInvoiceId);
        } catch (err) {
          logger.error('⚠️ [useVeribanInvoiceSend] Hata durumu güncellenemedi:', err);
        }
        queryClient.invalidateQueries({ queryKey: ["salesInvoices"] });
      }
    },
    onError: async (error: any, { salesInvoiceId }) => {
      logger.error("❌ Veriban e-fatura gönderim hatası:", error);
      
      // Check if confirmation is needed
      if (error?.message === 'NEEDS_CONFIRMATION' && error?.needsConfirmation) {
        // Open confirmation dialog
        setConfirmDialog({
          open: true,
          invoiceId: salesInvoiceId,
          currentStatus: error.currentStatus
        });
        return; // Don't show error toast
      }
      
      // Hata durumunda durumu 'error' olarak güncelle
      try {
        await supabase
          .from('sales_invoices')
          .update({ 
            einvoice_status: 'error',
            elogo_status: 4, // StateCode 4 = Hatalı
            einvoice_error_message: error?.message || 'E-fatura gönderilemedi'
          })
          .eq('id', salesInvoiceId);
        logger.debug('✅ [useVeribanInvoiceSend] Hata durumu (StateCode=4) veritabanına kaydedildi');
      } catch (err) {
        logger.error('⚠️ [useVeribanInvoiceSend] Hata durumu güncellenemedi:', err);
      }
      
      // Edge function'dan gelen detaylı hata mesajını göster
      let errorMessage = "E-fatura gönderilirken bir hata oluştu";
      
      if (error?.message) {
        if (error.message.includes("vergi numarası bulunamadı")) {
          errorMessage = "❌ " + error.message;
        } else if (error.message.includes("Veriban")) {
          errorMessage = "❌ " + error.message;
        } else if (error.message.includes("zaman aşımı")) {
          errorMessage = "⏱️ " + error.message + " Fatura durumunu kontrol edin.";
        } else {
          errorMessage = "❌ " + error.message;
        }
      }
      
      toast.error(errorMessage);
      
      // Hata durumunda da listeyi yenile (durum güncellemesi için)
      // Timeout durumunda, edge function hala çalışıyor olabilir, bu yüzden durumu kontrol et
      queryClient.invalidateQueries({ queryKey: ["salesInvoices"] });
      if (salesInvoiceId) {
        queryClient.invalidateQueries({ queryKey: ["einvoice-status", salesInvoiceId] });
        
        // Timeout durumunda, 5 saniye sonra tekrar kontrol et
        if (error?.message?.includes("zaman aşımı")) {
          setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: ["salesInvoices"] });
            queryClient.invalidateQueries({ queryKey: ["einvoice-status", salesInvoiceId] });
          }, 5000);
        }
      }
    },
  });

  // Confirmation dialog handlers
  const handleConfirmResend = useCallback(() => {
    if (confirmDialog.invoiceId) {
      logger.debug('✅ Kullanıcı tekrar göndermeyi onayladı:', confirmDialog.invoiceId);
      // forceResend = true ile tekrar çağır
      sendInvoiceMutation.mutate({
        salesInvoiceId: confirmDialog.invoiceId,
        forceResend: true
      });
    }
    setConfirmDialog({ open: false, invoiceId: null, currentStatus: null });
  }, [confirmDialog.invoiceId, sendInvoiceMutation]);

  const handleCancelResend = useCallback(() => {
    logger.debug('❌ Kullanıcı tekrar göndermeyi iptal etti');
    setConfirmDialog({ open: false, invoiceId: null, currentStatus: null });
    toast.info('E-fatura gönderimi iptal edildi');
  }, []);

  return {
    // Actions
    sendInvoice: sendInvoiceMutation.mutate,
    
    // States
    isSending: sendInvoiceMutation.isPending,
    
    // Confirmation dialog
    confirmDialog,
    handleConfirmResend,
    handleCancelResend,
  };
};
