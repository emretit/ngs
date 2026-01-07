import { useRef, useCallback, useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";

export const useVeribanInvoice = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const retryTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    invoiceId: string | null;
    currentStatus: {
      stateCode: number;
      stateName: string;
      userFriendlyStatus: string;
    } | null;
  }>({
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
      console.log('🚀 [useVeribanInvoice] Sending invoice to Veriban:', salesInvoiceId, 'forceResend:', forceResend);
      
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
        console.error('❌ [useVeribanInvoice] Edge function error:', error);
        console.error('❌ [useVeribanInvoice] Error context:', error.context);
        
        // Try to extract error message from response body
        let errorMessage = error.message || 'Bilinmeyen hata';
        
        if (error.context) {
          try {
            // Try to get response body if available
            if (error.context instanceof Response) {
              const responseText = await error.context.text();
              console.error('❌ [useVeribanInvoice] Response body:', responseText);
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
            console.error('❌ [useVeribanInvoice] Could not read response body:', e);
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
      
      console.log('✅ [useVeribanInvoice] Response:', data);
      return data;
    },
    onSuccess: (data, { salesInvoiceId }) => {
      console.log("🎯 Veriban e-fatura gönderim cevabı:", data);
      
      if (data?.success) {
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
        queryClient.invalidateQueries({ queryKey: ["salesInvoices"] });
      }
    },
    onError: (error: any, { salesInvoiceId }) => {
      console.error("❌ Veriban e-fatura gönderim hatası:", error);
      
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


  // Check invoice status (includes transfer status check automatically)
  const checkStatusMutation = useMutation({
    mutationFn: async (salesInvoiceId: string) => {
      console.log('🔄 [useVeribanInvoice] Durum kontrolü başlatılıyor:', salesInvoiceId);
      
      const { data, error } = await supabase.functions.invoke('veriban-invoice-status', {
        body: { 
          invoiceId: salesInvoiceId // Edge function 'invoiceId' bekliyor
        }
      });
      
      if (error) {
        console.error('❌ [useVeribanInvoice] Edge function hatası:', error);
        // Error context'ten detaylı hata mesajını al
        let errorMessage = error.message || 'Bilinmeyen hata';
        if (error.context) {
          try {
            if (error.context instanceof Response) {
              const responseText = await error.context.text();
              console.error('❌ [useVeribanInvoice] Response body:', responseText);
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
            console.error('❌ [useVeribanInvoice] Hata mesajı okunamadı:', e);
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
      
      console.log('✅ [useVeribanInvoice] Durum kontrolü başarılı:', data);
      console.log('📊 [useVeribanInvoice] Durum detayları:', {
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
      console.warn('⚠️ [useVeribanInvoice] Maksimum deneme sayısına ulaşıldı. Durum kontrol edilemedi.');
      toast.warning('Fatura işleniyor. Durum otomatik olarak güncellenecek.');
      return;
    }

    try {
      const result = await checkStatusMutation.mutateAsync(salesInvoiceId);
      
      console.log('✅ [useVeribanInvoice] Durum kontrolü başarılı');
      if (result.status) {
        console.log('📊 [useVeribanInvoice] Fatura durumu:', {
          stateCode: result.status.stateCode,
          durum: result.status.userFriendlyStatus,
          cevap: result.status.answerStatus || 'Henüz cevap yok',
        });
      }
      
      // Başarılı - işlem tamamlandı
      queryClient.invalidateQueries({ queryKey: ["einvoice-status", salesInvoiceId] });
      queryClient.invalidateQueries({ queryKey: ["salesInvoices"] });
      
    } catch (error: any) {
      console.warn('⚠️ [useVeribanInvoice] Durum kontrolü hatası:', error);
      
      // 202 (Accepted) - Transfer henüz tamamlanmamış, retry yap
      if (error?.message?.includes('henüz') || error?.message?.includes('işleniyor') || error?.message?.includes('bekliyor')) {
        const waitTime = Math.min(30000 * Math.pow(2, attempt), 300000); // Max 5 dakika
        console.log(`⏳ [useVeribanInvoice] Fatura işleniyor, ${waitTime / 1000} saniye sonra tekrar kontrol edilecek (deneme ${attempt + 1}/${maxAttempts})...`);
        
        const timeout = setTimeout(() => {
          checkStatusWithRetry(salesInvoiceId, attempt + 1, maxAttempts);
        }, waitTime);
        
        retryTimeoutsRef.current.set(salesInvoiceId, timeout);
      } else if (error?.message?.includes('bulunamadı')) {
        // Fatura bulunamadı - henüz işlenmemiş olabilir, retry yap
        const waitTime = Math.min(30000 * Math.pow(2, attempt), 300000);
        console.log(`⏳ [useVeribanInvoice] Fatura henüz işlenmemiş, ${waitTime / 1000} saniye sonra tekrar kontrol edilecek (deneme ${attempt + 1}/${maxAttempts})...`);
        
        const timeout = setTimeout(() => {
          checkStatusWithRetry(salesInvoiceId, attempt + 1, maxAttempts);
        }, waitTime);
        
        retryTimeoutsRef.current.set(salesInvoiceId, timeout);
      } else if (error?.message?.includes('Transfer hatası') || error?.message?.includes('MODEL CREATE ERROR')) {
        // Transfer hatası - retry yapma, direkt hata göster
        console.error('❌ [useVeribanInvoice] Transfer hatası:', error);
        toast.error(`Fatura gönderiminde hata: ${error.message}`);
        // Veritabanını güncelle
        queryClient.invalidateQueries({ queryKey: ["einvoice-status", salesInvoiceId] });
        queryClient.invalidateQueries({ queryKey: ["salesInvoices"] });
      } else {
        // Diğer hatalar - kritik değil, sadece logla
        console.error('❌ [useVeribanInvoice] Durum kontrolü hatası:', error);
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
        console.error("Durum kontrolü hatası:", error);
        if (!options?.silent) {
          toast.error('Durum kontrolü yapılamadı');
        }
        options?.onError?.(error);
      }
    });
  };

  // Toplu durum sorgulama: Tüm faturaların durumunu kontrol et
  const refreshAllInvoiceStatuses = useCallback(async () => {
    try {
      console.log('🔄 [BulkStatusRefresh] Başlatılıyor...');
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

      console.log(`📊 [BulkStatusRefresh] ${invoices.length} fatura bulundu`);

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
            console.error(`❌ [BulkStatusRefresh] ${invoice.fatura_no} hatası:`, statusError);
            errorCount++;
          } else if (data?.success) {
            console.log(`✅ [BulkStatusRefresh] ${invoice.fatura_no} güncellendi:`, data.status?.userFriendlyStatus);
            successCount++;
          } else {
            errorCount++;
          }
        } catch (err) {
          console.error(`❌ [BulkStatusRefresh] ${invoice.fatura_no} hatası:`, err);
          errorCount++;
        }
      });

      // Tüm sorguların bitmesini bekle
      await Promise.all(promises);

      console.log(`✅ [BulkStatusRefresh] Tamamlandı: ${successCount} başarılı, ${errorCount} hata`);

      // Listeyi yenile - tüm query'leri agresif şekilde yenile
      await queryClient.invalidateQueries({ queryKey: ["salesInvoices"] });
      await queryClient.invalidateQueries({ queryKey: ["einvoice-status"] });
      await queryClient.refetchQueries({ queryKey: ["salesInvoices"] });

      // Tüm componentleri güncelle
      window.dispatchEvent(new CustomEvent('einvoice-status-bulk-updated'));

      toast.success(`${successCount} fatura durumu güncellendi`, { id: 'bulk-refresh' });

    } catch (error: any) {
      console.error('❌ [BulkStatusRefresh] Hata:', error);
      toast.error('Fatura durumları güncellenirken hata oluştu', { id: 'bulk-refresh' });
    }
  }, [queryClient]);

  // Cleanup: Component unmount olduğunda tüm timeout'ları temizle
  useEffect(() => {
    return () => {
      // Tüm retry timeout'larını temizle
      retryTimeoutsRef.current.forEach((timeout, invoiceId) => {
        clearTimeout(timeout);
        console.log('🧹 [Cleanup] Retry timeout temizlendi:', invoiceId);
      });
      retryTimeoutsRef.current.clear();
    };
  }, []);

  // Confirmation dialog handlers
  const handleConfirmResend = useCallback(() => {
    if (confirmDialog.invoiceId) {
      console.log('✅ Kullanıcı tekrar göndermeyi onayladı:', confirmDialog.invoiceId);
      // forceResend = true ile tekrar çağır
      sendInvoiceMutation.mutate({
        salesInvoiceId: confirmDialog.invoiceId,
        forceResend: true
      });
    }
    setConfirmDialog({ open: false, invoiceId: null, currentStatus: null });
  }, [confirmDialog.invoiceId, sendInvoiceMutation]);

  const handleCancelResend = useCallback(() => {
    console.log('❌ Kullanıcı tekrar göndermeyi iptal etti');
    setConfirmDialog({ open: false, invoiceId: null, currentStatus: null });
    toast.info('E-fatura gönderimi iptal edildi');
  }, []);

  return {
    // Actions
    sendInvoice: sendInvoiceMutation.mutate,
    checkStatus,
    refreshAllInvoiceStatuses, // Toplu durum yenileme

    // States
    isSending: sendInvoiceMutation.isPending,
    isCheckingStatus: checkStatusMutation.isPending,
    
    // Confirmation dialog
    confirmDialog,
    handleConfirmResend,
    handleCancelResend,
  };
};

