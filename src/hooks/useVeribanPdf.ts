import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useVeribanPdf = () => {
  const [isDownloading, setIsDownloading] = useState(false);

  const downloadAndOpenPdf = async (
    invoiceId: string, 
    invoiceType: 'e-fatura' | 'e-arşiv',
    direction: 'incoming' | 'outgoing' = 'incoming'
  ) => {
    setIsDownloading(true);

    try {
      console.log('📄 [Veriban PDF] Starting PDF download:', { invoiceId, invoiceType, direction });

      const { data, error } = await supabase.functions.invoke('veriban-invoice-pdf', {
        body: {
          invoiceId,
          invoiceType,
          direction
        }
      });

      console.log('📡 [Veriban PDF] Supabase function response:', { data, error });

      if (error) {
        console.error('❌ [Veriban PDF] Supabase function error:', error);
        throw new Error(error.message || 'PDF indirme hatası');
      }

      if (!data) {
        throw new Error('Sunucudan yanıt alınamadı');
      }

      if (!data.success) {
        throw new Error(data.error || 'PDF indirme başarısız');
      }

      console.log('✅ [Veriban PDF] PDF downloaded successfully');

      if (!data.pdfData) {
        throw new Error('PDF verisi alınamadı');
      }

      // Base64 string'i temizle
      const base64Data = data.pdfData.replace(/[\s\n\r]/g, '');

      // Base64'i binary'ye dönüştür ve blob oluştur
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);

      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // PDF magic number kontrolü
      const pdfHeader = String.fromCharCode(...bytes.slice(0, 4));
      if (pdfHeader !== '%PDF') {
        throw new Error('Geçersiz PDF dosyası');
      }

      const blob = new Blob([bytes], { type: 'application/pdf' });

      // Blob URL oluştur ve yeni sekmede aç
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // URL'yi temizle
      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
      }, 30000);

      toast.success(`${invoiceType === 'e-fatura' ? 'E-Fatura' : 'E-Arşiv'} PDF'i yeni sekmede açıldı`);
      return { success: true, url: blobUrl };
    } catch (error) {
      console.error('❌ [Veriban PDF] PDF download error:', error);
      const errorMessage = error instanceof Error ? error.message : 'PDF açma hatası';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsDownloading(false);
    }
  };

  return {
    downloadAndOpenPdf,
    isDownloading
  };
};

