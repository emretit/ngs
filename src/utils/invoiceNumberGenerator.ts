import { supabase } from '@/integrations/supabase/client';
import { logger } from './logger';

interface GenerateInvoiceNumberParams {
  invoiceProfile: string;
  companyId: string;
}

/**
 * Fatura numarası oluşturur
 * invoice_profile'a göre doğru seri kodunu kullanır:
 * - EARSIVFATURA -> EAR seri kodu
 * - TEMELFATURA/TICARIFATURA -> NGS/FAT seri kodu
 */
export async function generateInvoiceNumber({ 
  invoiceProfile, 
  companyId 
}: GenerateInvoiceNumberParams): Promise<string | null> {
  try {
    logger.debug('📝 [InvoiceNumberGenerator] Fatura numarası oluşturuluyor...', { invoiceProfile, companyId });
    
    // Seri kodu parametresini belirle
    let formatKey = 'veriban_invoice_number_format'; // E-Fatura için varsayılan
    
    if (invoiceProfile === 'EARSIVFATURA') {
      formatKey = 'earchive_invoice_number_format'; // E-Arşiv için
      logger.debug('📋 [InvoiceNumberGenerator] E-Arşiv fatura için seri kodu kullanılacak');
    } else {
      logger.debug('📋 [InvoiceNumberGenerator] E-Fatura için seri kodu kullanılacak');
    }
    
    // Sistem parametresinden seri kodunu al
    const { data: formatParam, error: paramError } = await supabase
      .from('system_parameters')
      .select('parameter_value')
      .eq('parameter_key', formatKey)
      .eq('company_id', companyId)
      .maybeSingle();
    
    if (paramError) {
      logger.error('❌ [InvoiceNumberGenerator] Sistem parametresi alınamadı:', paramError);
      return null;
    }
    
    // Seri kodu (3 karakter, örn: EAR veya NGS)
    let serie = formatParam?.parameter_value || 'FAT';
    serie = serie.trim().toUpperCase().substring(0, 3);
    
    if (!serie || serie.length !== 3) {
      serie = 'FAT'; // Varsayılan seri
    }
    
    logger.debug('📋 [InvoiceNumberGenerator] Seri Kodu:', serie);
    
    // Yıl
    const year = new Date().getFullYear().toString();
    const prefix = `${serie}${year}`;
    
    // Veritabanından bu prefix ile başlayan en yüksek numarayı bul
    const { data: existingInvoices, error: queryError } = await supabase
      .from('sales_invoices')
      .select('fatura_no')
      .eq('company_id', companyId)
      .like('fatura_no', `${prefix}%`)
      .not('fatura_no', 'is', null)
      .order('fatura_no', { ascending: false })
      .limit(100);
    
    if (queryError) {
      logger.error('❌ [InvoiceNumberGenerator] Mevcut faturalar sorgulanamadı:', queryError);
      return null;
    }
    
    let maxSequence = 0;
    if (existingInvoices && existingInvoices.length > 0) {
      for (const inv of existingInvoices) {
        if (!inv.fatura_no || !inv.fatura_no.startsWith(prefix)) continue;
        const sequencePart = inv.fatura_no.substring(prefix.length);
        const num = parseInt(sequencePart);
        if (!isNaN(num) && num > maxSequence) {
          maxSequence = num;
        }
      }
    }
    
    // Bir sonraki numarayı üret
    const nextSequence = maxSequence + 1;
    const sequence = nextSequence.toString().padStart(9, '0');
    const invoiceNumber = `${serie}${year}${sequence}`;
    
    logger.debug('✅ [InvoiceNumberGenerator] Fatura numarası üretildi:', invoiceNumber);
    
    return invoiceNumber;
  } catch (error) {
    logger.error('❌ [InvoiceNumberGenerator] Fatura numarası oluşturulurken hata:', error);
    return null;
  }
}
