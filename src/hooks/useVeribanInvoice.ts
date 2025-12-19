import { useRef, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";

export const useVeribanInvoice = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const retryTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Send invoice to Veriban
  const sendInvoiceMutation = useMutation({
    mutationFn: async (salesInvoiceId: string) => {
      console.log('🚀 [useVeribanInvoice] Sending invoice to Veriban:', salesInvoiceId);
      
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
              } catch (e) {
                // Not JSON, use text as is
                if (responseText) {
                  errorMessage = responseText;
                }
              }
            } else if (error.context.body?.error) {
              errorMessage = error.context.body.error;
            }
          } catch (e) {
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
      
      console.log('✅ [useVeribanInvoice] Response:', data);
      return data;
    },
    onSuccess: (data, salesInvoiceId) => {
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

        // Fatura gönderildikten sonra durum kontrolü yap
        // veriban-invoice-status edge function'ı otomatik olarak önce transfer durumunu kontrol ediyor
        // Eğer transfer tamamlanmamışsa 202 (Accepted) döner ve retry yapılır
        // Eğer transfer tamamlandıysa invoice durumunu kontrol eder
        
        // İlk bekleme: 2-3 dakika (Veriban'ın dosyayı işlemesi için)
        const initialWaitTime = 2 * 60 * 1000; // 2 dakika
        
        setTimeout(() => {
          console.log('🔄 [useVeribanInvoice] Durum kontrolü başlatılıyor:', salesInvoiceId);
          checkStatusWithRetry(salesInvoiceId, 0);
        }, initialWaitTime);
      } else {
        toast.error(data?.error || data?.message || 'E-fatura gönderilemedi');
        queryClient.invalidateQueries({ queryKey: ["salesInvoices"] });
      }
    },
    onError: (error: any, salesInvoiceId) => {
      console.error("❌ Veriban e-fatura gönderim hatası:", error);
      
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

  return {
    // Actions
    sendInvoice: sendInvoiceMutation.mutate,
    checkStatus,

    // States
    isSending: sendInvoiceMutation.isPending,
    isCheckingStatus: checkStatusMutation.isPending,
  };
};

