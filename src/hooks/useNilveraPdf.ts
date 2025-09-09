import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useNilveraPdf = () => {
  const [isDownloading, setIsDownloading] = useState(false);

  const downloadAndOpenPdf = async (invoiceId: string, invoiceType: 'e-fatura' | 'e-arşiv') => {
    setIsDownloading(true);
    
    try {
      console.log('📄 Downloading PDF:', { invoiceId, invoiceType });

      const { data, error } = await supabase.functions.invoke('nilvera-invoices', {
        body: { 
          action: 'download_pdf',
          invoiceId,
          invoiceType
        }
      });

      if (error) {
        console.error('❌ PDF download error:', error);
        throw new Error(error.message || 'PDF indirme hatası');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'PDF indirme başarısız');
      }

      console.log('✅ PDF downloaded successfully, size:', data.size, 'bytes');

      // Convert base64 to blob
      const pdfData = data.pdfData;
      const byteCharacters = atob(pdfData);
      const byteNumbers = new Array(byteCharacters.length);
      
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });

      // Create object URL and open in new tab
      const url = URL.createObjectURL(blob);
      const newWindow = window.open(url, '_blank');
      
      if (!newWindow) {
        throw new Error('Pop-up engelleyici nedeniyle yeni sekme açılamadı');
      }

      // Clean up object URL after a delay
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);

      toast.success(`${invoiceType} PDF'i yeni sekmede açıldı`);
      
      return { success: true, url };

    } catch (error) {
      console.error('❌ PDF download and open error:', error);
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
