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
      console.log('📊 Response data:', { 
        success: data.success, 
        hasPdfData: !!data.pdfData, 
        pdfDataLength: data.pdfData?.length,
        size: data.size,
        mimeType: data.mimeType 
      });

      if (!data.pdfData) {
        console.error('❌ PDF verisi yok!', data);
        throw new Error('PDF verisi alınamadı');
      }

      // Base64 string'i temizle (boşluk, yeni satır karakterleri vs.)
      const base64Data = data.pdfData.replace(/[\s\n\r]/g, '');
      
      console.log('✅ Base64 data cleaned, length:', base64Data.length);
      console.log('🔍 Base64 preview (first 100 chars):', base64Data.substring(0, 100));

      // Base64'in geçerli olup olmadığını kontrol et
      if (base64Data.length === 0) {
        throw new Error('Base64 verisi boş');
      }

      // Base64'i binary'ye dönüştür ve blob oluştur
      try {
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        const blob = new Blob([bytes], { type: 'application/pdf' });
        console.log('✅ Blob created, size:', blob.size, 'bytes');
        
        if (blob.size === 0) {
          throw new Error('Blob boyutu sıfır - PDF verisi geçersiz');
        }

        // Blob URL oluştur
        const blobUrl = URL.createObjectURL(blob);
        console.log('✅ Blob URL created:', blobUrl);
        
        // Otomatik download için link oluştur
        const link = document.createElement('a');
        link.href = blobUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // URL'yi kısa bir süre sonra temizle (tarayıcı açma zamanı için)
        setTimeout(() => {
          URL.revokeObjectURL(blobUrl);
        }, 1000);

        toast.success(`${invoiceType} PDF'i yeni sekmede açıldı`);
        return { success: true, url: blobUrl };
      } catch (decodeError) {
        console.error('❌ Base64 decode hatası:', decodeError);
        throw new Error(`PDF verisi decode edilemedi: ${decodeError instanceof Error ? decodeError.message : 'Bilinmeyen hata'}`);
      }

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
