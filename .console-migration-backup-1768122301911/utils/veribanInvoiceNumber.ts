import { supabase } from '@/integrations/supabase/client';

/**
 * Veriban'a gönderilmiş faturaların en yüksek fatura numarasını alır
 * Veritabanımızdaki Veriban'a gönderilmiş faturalardan en yüksek numarayı bulur
 */
export const getLastVeribanInvoiceNumber = async (
  companyId: string,
  formatPattern?: string
): Promise<string | null> => {
  try {
    // Veriban'a gönderilmiş faturaları al (sent veya delivered durumunda)
    const { data: invoices, error } = await supabase
      .from('sales_invoices')
      .select('fatura_no')
      .eq('company_id', companyId)
      .in('einvoice_status', ['sent', 'delivered'])
      .not('fatura_no', 'is', null)
      .order('fatura_no', { ascending: false })
      .limit(100);

    if (error) {
      console.error('❌ Veriban fatura numarası sorgulama hatası:', error);
      return null;
    }

    if (!invoices || invoices.length === 0) {
      console.log('ℹ️ Veriban\'a gönderilmiş fatura bulunamadı');
      return null;
    }

    // En yüksek fatura numarasını bul
    let maxNumber: string | null = null;
    let maxSequence = 0;

    for (const invoice of invoices) {
      const invoiceNumber = invoice.fatura_no;
      if (!invoiceNumber) continue;

      // Format pattern varsa, o formata uygun numaraları filtrele
      if (formatPattern) {
        // Eğer format pattern sadece seri kodu ise (3 karakter, örn: 'FAT')
        let serie: string;
        if (formatPattern.length === 3 && /^[A-Z0-9]{3}$/.test(formatPattern)) {
          // Seri kodu olarak kullan
          serie = formatPattern;
        } else if (formatPattern.includes('{000000001}') || formatPattern.includes('invoice_number_format') || formatPattern.includes('einvoice_number_format') || formatPattern.includes('veriban_invoice_number_format')) {
          // GİB formatı: SERI(3) + YIL(4) + SIRA(9) = 16 karakter
          if (invoiceNumber.length !== 16) {
            continue; // GİB formatı değilse atla
          }

          // Format'tan seri kısmını çıkar
          serie = formatPattern
            .replace(/\{YYYY\}/g, '')
            .replace(/\{YY\}/g, '')
            .replace(/\{MM\}/g, '')
            .replace(/\{DD\}/g, '')
            .replace(/\{0+\}/g, '')
            .replace(/[-_]/g, '')
            .trim();
          
          if (!serie || serie.length !== 3) {
            serie = 'FAT'; // Varsayılan seri
          }
          // Eski format için (tire ile): FAT-2025-0001
          const year = new Date().getFullYear().toString();
          const yearShort = (new Date().getFullYear() % 100).toString().padStart(2, '0');
          const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
          const day = new Date().getDate().toString().padStart(2, '0');
          
          let prefix = formatPattern
            .replace('{YYYY}', year)
            .replace('{YY}', yearShort)
            .replace('{MM}', month)
            .replace('{DD}', day)
            .replace(/\{0+\}/g, ''); // Sıralı numara placeholder'ını kaldır
          
          prefix = prefix.replace(/[-_]+$/, ''); // Sonundaki - veya _ karakterlerini kaldır

          // Numara bu prefix ile başlamıyorsa atla
          if (!invoiceNumber.startsWith(prefix)) {
            continue;
          }
          continue; // Eski format için devam et
        }
        
        // Seri kodu varsa, GİB formatı kontrolü yap
        if (serie) {
          // GİB formatı: SERI(3) + YIL(4) + SIRA(9) = 16 karakter
          if (invoiceNumber.length !== 16) {
            continue; // GİB formatı değilse atla
          }

          const year = new Date().getFullYear().toString();
          const prefix = `${serie}${year}`; // SERI + YIL = 7 karakter

          // Numara bu prefix ile başlamıyorsa atla
          if (!invoiceNumber.startsWith(prefix)) {
            continue;
          }
        }
      }

      // Numara formatından sıra numarasını çıkar
      // GİB formatı: SERI(3) + YIL(4) + SIRA(9) = 16 karakter
      if (invoiceNumber.length === 16) {
        // GİB formatı: son 9 karakter sıra numarası
        const sequencePart = invoiceNumber.substring(7); // İlk 7 karakter (SERI+YIL) sonrası
        const num = parseInt(sequencePart);
        if (!isNaN(num) && num > maxSequence) {
          maxSequence = num;
          maxNumber = invoiceNumber;
        }
      } else {
        // Eski format: FAT-2025-0001 -> 1
        const match = invoiceNumber.match(/(\d+)$/);
        if (match) {
          const sequence = parseInt(match[1]);
          if (sequence > maxSequence) {
            maxSequence = sequence;
            maxNumber = invoiceNumber;
          }
        }
      }
    }

    if (maxNumber) {
      console.log('✅ Veriban\'dan en yüksek fatura numarası bulundu:', maxNumber);
      return maxNumber;
    }

    return null;
  } catch (error) {
    console.error('❌ Veriban fatura numarası alınırken hata:', error);
    return null;
  }
};

/**
 * Veriban fatura numarasından sıra numarasını çıkarır
 * GİB formatı: SERI(3) + YIL(4) + SIRA(9) = 16 karakter
 * Örn: FAT2025000000001 -> 1, APF2025000000641 -> 641
 */
export const extractSequenceFromInvoiceNumber = (
  invoiceNumber: string,
  formatPattern: string
): number | null => {
  try {
    // Eğer format pattern sadece seri kodu ise (3 karakter, örn: 'FAT')
    let serie: string | null = null;
    if (formatPattern.length === 3 && /^[A-Z0-9]{3}$/.test(formatPattern)) {
      // Seri kodu olarak kullan
      serie = formatPattern;
    } else if (formatPattern.includes('{000000001}') || formatPattern.includes('invoice_number_format') || formatPattern.includes('einvoice_number_format')) {
      // Format'tan seri kısmını çıkar
      serie = formatPattern
        .replace(/\{YYYY\}/g, '')
        .replace(/\{YY\}/g, '')
        .replace(/\{MM\}/g, '')
        .replace(/\{DD\}/g, '')
        .replace(/\{0+\}/g, '')
        .replace(/[-_]/g, '')
        .trim();
      
      if (!serie || serie.length !== 3) {
        serie = 'FAT'; // Varsayılan seri
      }
    }
    
    // Seri kodu varsa, GİB formatı kontrolü yap
    if (serie) {
      // GİB formatı: SERI(3) + YIL(4) + SIRA(9) = 16 karakter
      if (invoiceNumber.length !== 16) {
        console.warn('⚠️ GİB formatı 16 karakter değil:', invoiceNumber, 'Uzunluk:', invoiceNumber.length);
        return null;
      }

      const year = new Date().getFullYear().toString();
      const prefix = `${serie}${year}`; // SERI + YIL = 7 karakter

      // Numara bu prefix ile başlamıyorsa null döndür
      if (!invoiceNumber.startsWith(prefix)) {
        console.warn('⚠️ Fatura numarası prefix ile başlamıyor:', invoiceNumber, 'Prefix:', prefix);
        return null;
      }

      // Prefix'ten sonraki kısmı al (sıra numarası - 9 karakter)
      const sequencePart = invoiceNumber.substring(prefix.length); // 7 karakterden sonra 9 karakter
      
      if (sequencePart.length !== 9) {
        console.warn('⚠️ Sıra numarası kısmı 9 karakter değil:', sequencePart, 'Uzunluk:', sequencePart.length);
        return null;
      }

      const sequence = parseInt(sequencePart);
      if (isNaN(sequence)) {
        return null;
      }

      return sequence;
    }

    // Eski format için (tire ile): FAT-2025-0001 -> 1
    // Format pattern'den sıra numarası placeholder'ını bul
    const sequencePlaceholder = formatPattern.match(/\{0+\}/);
    if (!sequencePlaceholder) {
      return null;
    }

    // Format pattern'den prefix'i oluştur (sıra numarası hariç)
    const year = new Date().getFullYear().toString();
    const yearShort = (new Date().getFullYear() % 100).toString().padStart(2, '0');
    const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
    const day = new Date().getDate().toString().padStart(2, '0');
    
    let prefix = formatPattern
      .replace('{YYYY}', year)
      .replace('{YY}', yearShort)
      .replace('{MM}', month)
      .replace('{DD}', day)
      .replace(/\{0+\}/g, ''); // Sıra numarası placeholder'ını kaldır
    
    prefix = prefix.replace(/[-_]+$/, ''); // Sonundaki - veya _ karakterlerini kaldır

    // Numara bu prefix ile başlamıyorsa null döndür
    if (!invoiceNumber.startsWith(prefix)) {
      return null;
    }

    // Prefix'ten sonraki kısmı al (sıra numarası)
    const suffix = invoiceNumber.substring(prefix.length);
    // Sonundaki - veya _ karakterlerini kaldır
    const cleanSuffix = suffix.replace(/^[-_]+/, '');
    
    const sequence = parseInt(cleanSuffix);
    if (isNaN(sequence)) {
      return null;
    }

    return sequence;
  } catch (error) {
    console.error('❌ Sıra numarası çıkarılırken hata:', error);
    return null;
  }
};

/**
 * Veriban fatura numarası formatını kontrol eder
 * GİB formatı: SERI(3) + YIL(4) + SIRA(9) = 16 karakter
 * Format pattern'e uygun mu kontrol eder
 */
export const validateVeribanInvoiceNumberFormat = (
  invoiceNumber: string,
  formatPattern: string
): boolean => {
  try {
    // Eğer format pattern sadece seri kodu ise (3 karakter, örn: 'FAT')
    let serie: string | null = null;
    if (formatPattern.length === 3 && /^[A-Z0-9]{3}$/.test(formatPattern)) {
      // Seri kodu olarak kullan
      serie = formatPattern;
    } else if (formatPattern.includes('{000000001}') || formatPattern.includes('invoice_number_format') || formatPattern.includes('einvoice_number_format')) {
      // Format'tan seri kısmını çıkar
      serie = formatPattern
        .replace(/\{YYYY\}/g, '')
        .replace(/\{YY\}/g, '')
        .replace(/\{MM\}/g, '')
        .replace(/\{DD\}/g, '')
        .replace(/\{0+\}/g, '')
        .replace(/[-_]/g, '')
        .trim();
      
      if (!serie || serie.length !== 3) {
        serie = 'FAT'; // Varsayılan seri
      }
    }
    
    // Seri kodu varsa, GİB formatı kontrolü yap
    if (serie) {
      // GİB formatı: SERI(3) + YIL(4) + SIRA(9) = 16 karakter
      if (invoiceNumber.length !== 16) {
        console.warn('⚠️ GİB formatı 16 karakter değil:', invoiceNumber, 'Uzunluk:', invoiceNumber.length);
        return false;
      }

      const year = new Date().getFullYear().toString();
      const prefix = `${serie}${year}`; // SERI + YIL = 7 karakter

      // Numara bu prefix ile başlamalı
      if (!invoiceNumber.startsWith(prefix)) {
        return false;
      }

      // Sıra numarası kısmı (9 karakter) sayı olmalı
      const sequencePart = invoiceNumber.substring(prefix.length);
      if (sequencePart.length !== 9) {
        return false;
      }

      const sequence = parseInt(sequencePart);
      return !isNaN(sequence) && sequence > 0;
    }

    // Eski format için (tire ile): FAT-2025-0001
    // Format pattern'den prefix'i oluştur
    const year = new Date().getFullYear().toString();
    const yearShort = (new Date().getFullYear() % 100).toString().padStart(2, '0');
    const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
    const day = new Date().getDate().toString().padStart(2, '0');
    
    let prefix = formatPattern
      .replace('{YYYY}', year)
      .replace('{YY}', yearShort)
      .replace('{MM}', month)
      .replace('{DD}', day)
      .replace(/\{0+\}/g, ''); // Sıra numarası placeholder'ını kaldır
    
    prefix = prefix.replace(/[-_]+$/, ''); // Sonundaki - veya _ karakterlerini kaldır

    // Numara bu prefix ile başlamalı
    if (!invoiceNumber.startsWith(prefix)) {
      return false;
    }

    // Sıra numarası kısmı sayı olmalı
    const suffix = invoiceNumber.substring(prefix.length);
    const cleanSuffix = suffix.replace(/^[-_]+/, '');
    const sequence = parseInt(cleanSuffix);
    
    return !isNaN(sequence) && sequence > 0;
  } catch (error) {
    console.error('❌ Format kontrolü sırasında hata:', error);
    return false;
  }
};

