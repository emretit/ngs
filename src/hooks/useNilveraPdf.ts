import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useNilveraPdf = () => {
  const [isDownloading, setIsDownloading] = useState(false);

  const downloadAndOpenPdf = async (invoiceId: string, invoiceType: 'e-fatura' | 'e-arşiv') => {
    setIsDownloading(true);

    try {
      console.log('📄 Starting PDF download:', { invoiceId, invoiceType });
      console.log('🔍 Invoice UUID:', invoiceId);
      console.log('📋 Invoice Type:', invoiceType);

      const { data, error } = await supabase.functions.invoke('nilvera-invoice-pdf', {
        body: {
          invoiceId,
          invoiceType
        }
      });

      console.log('📡 Supabase function response:', { data, error });

      if (error) {
        console.error('❌ Supabase function error:', error);
        console.error('❌ Error details:', {
          message: error.message,
          context: error.context,
          status: error.status
        });

        // Edge function'dan dönen hata yanıtını parse et
        let errorMessage = error.message || 'PDF indirme hatası';
        
        // error.context bir Response objesi olabilir
        if (error.context instanceof Response) {
          try {
            const errorData = await error.context.json();
            console.error('❌ Parsed error response:', errorData);
            errorMessage = errorData.error || errorData.message || errorMessage;
          } catch (parseError) {
            console.error('❌ Failed to parse error response:', parseError);
            // Response'u text olarak oku
            try {
              const errorText = await error.context.text();
              console.error('❌ Error response text:', errorText);
              errorMessage = errorText || errorMessage;
            } catch (textError) {
              console.error('❌ Failed to read error response as text:', textError);
            }
          }
        }

        throw new Error(errorMessage);
      }

      if (!data) {
        console.error('❌ No data received from function');
        throw new Error('Sunucudan yanıt alınamadı. Edge function yanıt vermedi.');
      }

      if (!data.success) {
        console.error('❌ Function returned error:', data);
        const errorMessage = data.error || data.message || 'PDF indirme başarısız';
        console.error('❌ Error details:', data.details);
        throw new Error(errorMessage);
      }

      console.log('✅ PDF downloaded successfully');
      console.log('📊 PDF metadata:', {
        size: data.size,
        mimeType: data.mimeType,
        hasPdfData: !!data.pdfData,
        pdfDataLength: data.pdfData?.length
      });

      if (!data.pdfData) {
        console.error('❌ PDF verisi yok!', data);
        throw new Error('PDF verisi alınamadı - Nilvera API boş yanıt döndü');
      }

      // Base64 string'i temizle (boşluk, yeni satır karakterleri vs.)
      const base64Data = data.pdfData.replace(/[\s\n\r]/g, '');

      console.log('✅ Base64 data cleaned, length:', base64Data.length);
      console.log('🔍 Base64 preview (first 100 chars):', base64Data.substring(0, 100));
      console.log('🔍 Base64 preview (last 100 chars):', base64Data.substring(Math.max(0, base64Data.length - 100)));

      // Base64'in geçerli olup olmadığını kontrol et
      if (base64Data.length === 0) {
        throw new Error('Base64 verisi boş - Nilvera API geçersiz yanıt döndü');
      }

      // Base64 format kontrolü
      const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
      if (!base64Regex.test(base64Data)) {
        console.error('❌ Geçersiz Base64 formatı!');
        throw new Error('PDF verisi geçersiz Base64 formatında');
      }

      // Base64'i binary'ye dönüştür ve blob oluştur
      try {
        console.log('🔄 Converting Base64 to binary...');
        const binaryString = atob(base64Data);
        console.log('✅ Base64 decoded to binary, length:', binaryString.length, 'bytes');

        const bytes = new Uint8Array(binaryString.length);

        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        // PDF magic number kontrolü (%PDF)
        const pdfHeader = String.fromCharCode(...bytes.slice(0, 4));
        console.log('🔍 PDF Header check:', pdfHeader);

        if (pdfHeader !== '%PDF') {
          console.error('❌ PDF header kontrolü başarısız!');
          console.error('❌ Beklenen: %PDF');
          console.error('❌ Gelen:', pdfHeader);
          const previewText = String.fromCharCode(...bytes.slice(0, 100));
          console.error('❌ İçerik önizlemesi:', previewText);
          throw new Error(`Geçersiz PDF dosyası. Dosya başlığı '%PDF' değil. Nilvera'dan gelen yanıt PDF değil.`);
        }

        const blob = new Blob([bytes], { type: 'application/pdf' });
        console.log('✅ Blob created, size:', blob.size, 'bytes');

        if (blob.size === 0) {
          throw new Error('Blob boyutu sıfır - PDF verisi geçersiz');
        }

        // Blob URL oluştur
        const blobUrl = URL.createObjectURL(blob);
        console.log('✅ Blob URL created:', blobUrl);

        // Yeni sekmede aç - sadece link yöntemini kullan (daha güvenilir, popup blocker sorunları olmaz)
        const link = document.createElement('a');
        link.href = blobUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        console.log('✅ PDF opened in new tab via link click');

        // URL'yi daha uzun bir süre sonra temizle (PDF viewer loading time için)
        setTimeout(() => {
          URL.revokeObjectURL(blobUrl);
          console.log('🧹 Blob URL cleaned up');
        }, 30000); // 30 saniye

        toast.success(`${invoiceType === 'e-fatura' ? 'E-Fatura' : 'E-Arşiv'} PDF'i yeni sekmede açıldı`);
        return { success: true, url: blobUrl };
      } catch (decodeError) {
        console.error('❌ Base64 decode/blob hatası:', decodeError);

        if (decodeError instanceof Error && decodeError.message.includes('invalid character')) {
          throw new Error('PDF verisi bozuk Base64 formatında - Nilvera API hatası');
        }

        throw new Error(`PDF işleme hatası: ${decodeError instanceof Error ? decodeError.message : 'Bilinmeyen hata'}`);
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
