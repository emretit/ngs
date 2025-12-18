import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";

export const useVeribanInvoice = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // Send invoice to Veriban
  const sendInvoiceMutation = useMutation({
    mutationFn: async (salesInvoiceId: string) => {
      console.log('🚀 [useVeribanInvoice] Sending invoice to Veriban:', salesInvoiceId);
      
      const { data, error } = await supabase.functions.invoke('veriban-send-invoice', {
        body: { 
          invoiceId: salesInvoiceId,
          isDirectSend: true, // Direkt GİB'e gönder
        }
      });
      
      if (error) {
        console.error('❌ [useVeribanInvoice] Edge function error:', error);
        // Handle specific error cases
        if (error.message?.includes('409')) {
          throw new Error('Bu fatura zaten gönderiliyor veya gönderilmiş. Lütfen birkaç dakika bekleyin.');
        } else if (error.message?.includes('401')) {
          throw new Error('Veriban kimlik doğrulama hatası. Lütfen ayarlarınızı kontrol edin.');
        } else if (error.message?.includes('404')) {
          throw new Error('Fatura bulunamadı.');
        } else if (error.message?.includes('veri bulunamadı')) {
          throw new Error('Veriban kimlik doğrulama bilgileri bulunamadı. Lütfen ayarlar sayfasından Veriban bilgilerinizi girin.');
        }
        throw error;
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
        } else {
          errorMessage = "❌ " + error.message;
        }
      }
      
      toast.error(errorMessage);
      
      // Hata durumunda da listeyi yenile (durum güncellemesi için)
      queryClient.invalidateQueries({ queryKey: ["salesInvoices"] });
      if (salesInvoiceId) {
        queryClient.invalidateQueries({ queryKey: ["einvoice-status", salesInvoiceId] });
      }
    },
  });

  // Check invoice status
  const checkStatusMutation = useMutation({
    mutationFn: async (salesInvoiceId: string) => {
      const { data, error } = await supabase.functions.invoke('veriban-invoice-status', {
        body: { 
          salesInvoiceId 
        }
      });
      
      if (error) throw error;
      return data?.success || false;
    },
    onSuccess: (success, salesInvoiceId) => {
      if (success) {
        toast.success('Durum kontrolü tamamlandı');
        queryClient.invalidateQueries({ queryKey: ["einvoice-status", salesInvoiceId] });
        queryClient.invalidateQueries({ queryKey: ["salesInvoices"] });
      } else {
        toast.error('Durum kontrolü başarısız');
      }
    },
    onError: (error) => {
      console.error("Durum kontrolü hatası:", error);
      toast.error('Durum kontrolü yapılamadı');
    },
  });

  return {
    // Actions
    sendInvoice: sendInvoiceMutation.mutate,
    checkStatus: checkStatusMutation.mutate,

    // States
    isSending: sendInvoiceMutation.isPending,
    isCheckingStatus: checkStatusMutation.isPending,
  };
};

