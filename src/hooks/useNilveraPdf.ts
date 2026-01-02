import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

export const useNilveraPdf = () => {
  const [isDownloading, setIsDownloading] = useState(false);

  const downloadAndOpenPdf = async (invoiceId: string, invoiceType: 'e-fatura' | 'e-arşiv') => {
    setIsDownloading(true);

    try {
      logger.info("Starting PDF download", { invoiceId, invoiceType });
      logger.debug("Invoice UUID", invoiceId);
      logger.debug("Invoice Type", invoiceType);

      const { data, error } = await supabase.functions.invoke('nilvera-invoice-pdf', {
        body: {
          invoiceId,
          invoiceType
        }
      });

      logger.debug("Supabase function response", { data, error });

      if (error) {
        logger.error("Supabase function error", error);
        logger.error("Error details", {
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
            logger.error("Parsed error response", errorData);
            errorMessage = errorData.error || errorData.message || errorMessage;
          } catch (parseError) {
            logger.error("Failed to parse error response", parseError);
            // Response'u text olarak oku
            try {
              const errorText = await error.context.text();
              logger.error("Error response text", errorText);
              errorMessage = errorText || errorMessage;
            } catch (textError) {
              logger.error("Failed to read error response as text", textError);
            }
          }
        }

        throw new Error(errorMessage);
      }

      if (!data) {
        logger.error("No data received from function");
        throw new Error('Sunucudan yanıt alınamadı. Edge function yanıt vermedi.');
      }

      if (!data.success) {
        logger.error("Function returned error", data);
        const errorMessage = data.error || data.message || 'PDF indirme başarısız';
        logger.error("Error details", data.details);
        throw new Error(errorMessage);
      }

      logger.info("PDF downloaded successfully");
      logger.debug("PDF metadata", {
        size: data.size,
        mimeType: data.mimeType,
        hasPdfData: !!data.pdfData,
        pdfDataLength: data.pdfData?.length
      });

      if (!data.pdfData) {
        logger.error("PDF data missing", data);
        throw new Error('PDF verisi alınamadı - Nilvera API boş yanıt döndü');
      }

      // Base64 string'i temizle (boşluk, yeni satır karakterleri vs.)
      const base64Data = data.pdfData.replace(/[\s\n\r]/g, '');

      logger.debug("Base64 data cleaned, length", base64Data.length);
      logger.debug("Base64 preview (first 100 chars)", base64Data.substring(0, 100));
      logger.debug("Base64 preview (last 100 chars)", base64Data.substring(Math.max(0, base64Data.length - 100)));

      // Base64'in geçerli olup olmadığını kontrol et
      if (base64Data.length === 0) {
        throw new Error('Base64 verisi boş - Nilvera API geçersiz yanıt döndü');
      }

      // Base64 format kontrolü
      const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
      if (!base64Regex.test(base64Data)) {
        logger.error("Invalid Base64 format");
        throw new Error('PDF verisi geçersiz Base64 formatında');
      }

      // Base64'i binary'ye dönüştür ve blob oluştur
      try {
        logger.debug("Converting Base64 to binary");
        const binaryString = atob(base64Data);
        logger.debug("Base64 decoded to binary", { length: binaryString.length, unit: 'bytes' });

        const bytes = new Uint8Array(binaryString.length);

        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        // PDF magic number kontrolü (%PDF)
        const pdfHeader = String.fromCharCode(...bytes.slice(0, 4));
        logger.debug("PDF Header check", pdfHeader);

        if (pdfHeader !== '%PDF') {
          logger.error("PDF header check failed");
          logger.error("Expected: %PDF");
          logger.error("Received", pdfHeader);
          const previewText = String.fromCharCode(...bytes.slice(0, 100));
          logger.error("Content preview", previewText);
          throw new Error(`Geçersiz PDF dosyası. Dosya başlığı '%PDF' değil. Nilvera'dan gelen yanıt PDF değil.`);
        }

        const blob = new Blob([bytes], { type: 'application/pdf' });
        logger.debug("Blob created", { size: blob.size, unit: 'bytes' });

        if (blob.size === 0) {
          throw new Error('Blob boyutu sıfır - PDF verisi geçersiz');
        }

        // Blob URL oluştur
        const blobUrl = URL.createObjectURL(blob);
        logger.debug("Blob URL created", blobUrl);

        // Yeni sekmede aç - sadece link yöntemini kullan (daha güvenilir, popup blocker sorunları olmaz)
        const link = document.createElement('a');
        link.href = blobUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        logger.info("PDF opened in new tab via link click");

        // URL'yi daha uzun bir süre sonra temizle (PDF viewer loading time için)
        setTimeout(() => {
          URL.revokeObjectURL(blobUrl);
          logger.debug("Blob URL cleaned up");
        }, 30000); // 30 saniye

        toast.success(`${invoiceType === 'e-fatura' ? 'E-Fatura' : 'E-Arşiv'} PDF'i yeni sekmede açıldı`);
        return { success: true, url: blobUrl };
      } catch (decodeError) {
        logger.error("Base64 decode/blob error", decodeError);

        if (decodeError instanceof Error && decodeError.message.includes('invalid character')) {
          throw new Error('PDF verisi bozuk Base64 formatında - Nilvera API hatası');
        }

        throw new Error(`PDF işleme hatası: ${decodeError instanceof Error ? decodeError.message : 'Bilinmeyen hata'}`);
      }

    } catch (error) {
      logger.error("PDF download and open error", error);
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
