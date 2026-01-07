import { supabase } from '@/integrations/supabase/client';
import { EInvoiceDetails } from '../types';
import { logger } from '@/utils/logger';

/**
 * Giden e-fatura detaylarını yükler (Sales Invoice)
 * MÜŞTERİ bilgilerini döndürür (CustomerInfo)
 * 
 * NOT: Giden faturalar zaten veritabanında (outgoing_invoices), 
 * API'den tekrar çekmemize gerek yok!
 */
export const loadOutgoingInvoiceDetails = async (invoiceId: string): Promise<EInvoiceDetails> => {
  console.log('🔄 Loading OUTGOING invoice details from DATABASE for:', invoiceId);

  // Veritabanından giden faturayı çek
  // invoiceId URL'den gelen id olabilir, önce id'ye göre kontrol edelim
  const { data: invoiceData, error: invoiceError } = await supabase
    .from('outgoing_invoices')
    .select('*')
    .eq('id', invoiceId)
    .single();

  if (invoiceError) {
    console.error('❌ Error loading outgoing invoice from database:', invoiceError);
    throw new Error(`Giden fatura veritabanında bulunamadı: ${invoiceError.message}`);
  }

  if (!invoiceData) {
    throw new Error('Giden fatura veritabanında bulunamadı');
  }

  console.log('✅ Outgoing invoice loaded from database:', invoiceData);

  // Invoice items'ı da yükle (eğer ayrı tabloda ise)
  const { data: itemsData, error: itemsError } = await supabase
    .from('outgoing_invoice_items')
    .select('*')
    .eq('outgoing_invoice_id', invoiceData.id)
    .order('line_number');

  if (itemsError) {
    console.warn('⚠️ Error loading invoice items:', itemsError);
  }

  console.log('✅ Loaded invoice items:', itemsData);

  // Veritabanından gelen veriyi API response formatına dönüştür
  const apiInvoiceDetails: any = {
    id: invoiceData.ettn,
    invoiceNumber: invoiceData.invoice_number,
    invoiceDate: invoiceData.invoice_date,
    dueDate: invoiceData.due_date,
    currency: invoiceData.currency,
    taxExclusiveAmount: invoiceData.tax_exclusive_amount,
    taxTotalAmount: invoiceData.tax_total_amount,
    payableAmount: invoiceData.payable_amount,
    lineExtensionAmount: invoiceData.line_extension_amount,
    totalDiscountAmount: invoiceData.total_discount_amount,
    customerInfo: {
      name: invoiceData.customer_name,
      taxNumber: invoiceData.customer_tax_number,
      taxOffice: invoiceData.customer_tax_office,
      address: {
        street: invoiceData.customer_address_street,
        city: invoiceData.customer_address_city,
        district: invoiceData.customer_address_district,
        postalCode: invoiceData.customer_address_postal_zone,
        country: invoiceData.customer_address_country || 'Türkiye'
      },
      contact: {
        name: invoiceData.customer_contact_name,
        phone: invoiceData.customer_contact_telephone,
        email: invoiceData.customer_contact_email
      }
    },
    items: itemsData || []
  };

  console.log('\n' + '='.repeat(80));
  console.log('🔍 OUTGOING INVOICE DATA FROM DATABASE');
  logger.debug('Full outgoing invoice details loaded', {
    invoiceId: apiInvoiceDetails?.id,
    availableKeys: apiInvoiceDetails ? Object.keys(apiInvoiceDetails) : [],
    itemsCount: apiInvoiceDetails?.items?.length || 0
  });
  
  // ========================================
  // 📦 ITEMS KONTROLÜ
  // ========================================
  if (apiInvoiceDetails?.items && apiInvoiceDetails.items.length > 0) {
    logger.debug('Items from database (Sales Invoice)', {
      count: apiInvoiceDetails.items.length,
      firstItem: apiInvoiceDetails.items[0],
      allItems: apiInvoiceDetails.items
    });
  } else {
    logger.warn('No items found in database (Sales Invoice)');
  }

  // ========================================
  // 🔄 MAPPING ITEMS
  // ========================================
  const items = apiInvoiceDetails?.items?.map((item: any, index: number) => {
    logger.debug(`Mapping item ${index + 1}/${apiInvoiceDetails.items.length}`, { rawItem: item });
    
    return {
      id: item.id || `item-${index}`,
      line_number: item.line_number || index + 1,
      product_name: item.product_name || item.description || 'Açıklama yok',
      product_code: item.product_code || '',
      quantity: parseFloat(String(item.quantity || 1)),
      unit: item.unit || item.unit_code || 'adet',
      unit_price: parseFloat(String(item.unit_price || 0)),
      tax_rate: parseFloat(String(item.tax_rate || 18)),
      discount_rate: parseFloat(String(item.discount_rate || 0)),
      line_total: parseFloat(String(item.line_total || 0)),
      tax_amount: parseFloat(String(item.tax_amount || 0)),
      gtip_code: item.gtip_code,
      description: item.description || item.product_name
    };
  }) || [];
  
  logger.debug('Items mapping completed (Sales Invoice)', {
    totalItems: items.length,
    items: items
  });

  // Detaylı MÜŞTERİ bilgilerini çıkar (GİDEN FATURA İÇİN)
  const customerInfo = apiInvoiceDetails?.customerInfo || {};
  
  logger.debug('Customer info from database (Sales Invoice)', {
    customerInfo,
    availableKeys: apiInvoiceDetails ? Object.keys(apiInvoiceDetails) : []
  });

  // Müşteri adı için önce customerInfo'dan, sonra fallback'ler
  const customerName =
    customerInfo?.name ||
    apiInvoiceDetails?.customerName ||
    'Müşteri';

  // Müşteri VKN için önce customerInfo'dan, sonra fallback'ler
  const customerTaxNumber =
    customerInfo?.taxNumber ||
    apiInvoiceDetails?.customerTaxNumber ||
    '';

  console.log('✅ Extracted customer info (Sales Invoice):', { customerName, customerTaxNumber });

  // Fatura tutar bilgilerini doğru alanlardan çek
  const subtotal = parseFloat(String(
    apiInvoiceDetails?.taxExclusiveAmount || 
    apiInvoiceDetails?.lineExtensionAmount ||
    '0'
  ));
  const taxTotal = parseFloat(String(
    apiInvoiceDetails?.taxTotalAmount || 
    '0'
  ));
  const totalAmount = parseFloat(String(
    apiInvoiceDetails?.payableAmount || 
    '0'
  ));
  
  console.log('💰 Invoice amounts (Sales Invoice):', { subtotal, taxTotal, totalAmount });

  // Fatura tarihini doğru şekilde parse et
  let rawInvoiceDate: string | null = apiInvoiceDetails?.invoiceDate || null;
  console.log('📅 invoiceDate from database (Sales Invoice):', rawInvoiceDate);
  
  // Tarih formatını normalize et
  let normalizedInvoiceDate: string;
  if (rawInvoiceDate) {
    console.log('📅 Raw invoice date value:', rawInvoiceDate, 'Type:', typeof rawInvoiceDate);
    if (rawInvoiceDate.includes('T')) {
      normalizedInvoiceDate = rawInvoiceDate;
      console.log('📅 Date is ISO format, using as-is');
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(rawInvoiceDate)) {
      normalizedInvoiceDate = `${rawInvoiceDate}T00:00:00Z`;
      console.log('📅 Date is YYYY-MM-DD format, converting to ISO');
    } else {
      const parsedDate = new Date(rawInvoiceDate);
      if (!isNaN(parsedDate.getTime())) {
        normalizedInvoiceDate = parsedDate.toISOString();
        console.log('📅 Date parsed successfully:', normalizedInvoiceDate);
      } else {
        console.warn('⚠️ Invalid date format, using current date as fallback');
        normalizedInvoiceDate = new Date().toISOString();
      }
    }
    console.log('✅ Normalized invoice date (Sales Invoice):', normalizedInvoiceDate);
  } else {
    console.warn('⚠️ No invoice date found! Using current date as fallback');
    normalizedInvoiceDate = new Date().toISOString();
  }

  // Vade tarihini de aynı şekilde parse et
  let rawDueDate: string | null = apiInvoiceDetails?.dueDate || null;
  
  let normalizedDueDate: string | null = null;
  if (rawDueDate) {
    console.log('📅 Raw due date value (Sales Invoice):', rawDueDate);
    if (rawDueDate.includes('T')) {
      normalizedDueDate = rawDueDate;
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(rawDueDate)) {
      normalizedDueDate = `${rawDueDate}T00:00:00Z`;
    } else {
      const parsedDate = new Date(rawDueDate);
      if (!isNaN(parsedDate.getTime())) {
        normalizedDueDate = parsedDate.toISOString();
      }
    }
    console.log('✅ Normalized due date (Sales Invoice):', normalizedDueDate);
  } else {
    console.log('ℹ️ No due date found in database (Sales Invoice)');
  }

  const invoiceDetails: EInvoiceDetails = {
    id: invoiceId,
    invoice_number: apiInvoiceDetails?.invoiceNumber || invoiceId,
    supplier_name: customerName, // GİDEN FATURADA MÜŞTERİ ADI
    supplier_tax_number: customerTaxNumber, // GİDEN FATURADA MÜŞTERİ VKN
    invoice_date: normalizedInvoiceDate,
    due_date: normalizedDueDate,
    currency: apiInvoiceDetails?.currency || 'TRY',
    subtotal: subtotal,
    tax_total: taxTotal,
    total_amount: totalAmount,
    items,
    supplier_details: {
      company_name: customerName, // Müşteri adı
      tax_number: customerTaxNumber, // Müşteri VKN
      trade_registry_number: customerInfo?.tradeRegistryNumber || null,
      mersis_number: customerInfo?.mersisNumber || null,
      email: customerInfo?.contact?.email || customerInfo?.email || null,
      phone: customerInfo?.contact?.phone || customerInfo?.phone || null,
      website: customerInfo?.website || null,
      fax: customerInfo?.fax || null,
      address: {
        street: customerInfo?.address?.street || null,
        district: customerInfo?.address?.district || null,
        city: customerInfo?.address?.city || null,
        postal_code: customerInfo?.address?.postalCode || customerInfo?.address?.postal_code || null,
        country: customerInfo?.address?.country || 'Türkiye'
      },
      bank_info: {
        bank_name: customerInfo?.bankInfo?.bankName || null,
        iban: customerInfo?.bankInfo?.iban || null,
        account_number: customerInfo?.bankInfo?.accountNumber || null
      }
    }
  };

  logger.debug('Outgoing invoice details mapped successfully', { invoiceDetails });

  return invoiceDetails;
};
