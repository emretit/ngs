import { supabase } from '@/integrations/supabase/client';
import { EInvoiceDetails } from '../types';
import { IntegratorService } from '@/services/integratorService';
import { VeribanService } from '@/services/veribanService';
import { logger } from '@/utils/logger';

export const loadInvoiceDetails = async (invoiceId: string): Promise<EInvoiceDetails> => {
  // Önce integrator'ü kontrol et
  const integrator = await IntegratorService.getSelectedIntegrator();
  logger.debug('🔄 Loading invoice details from', integrator, 'API for:', invoiceId);

  let apiInvoiceDetails: any;

  if (integrator === 'veriban') {
    // Veriban API çağrısı
    const result = await VeribanService.getInvoiceDetails({
      invoiceUUID: invoiceId
    });

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Veriban fatura detayları alınamadı');
    }

    logger.debug('✅ Veriban API Response:', result.data);
    apiInvoiceDetails = result.data;
  } else {
    // Nilvera API çağrısı (varsayılan)
    const { data: detailsData, error: detailsError } = await supabase.functions.invoke('nilvera-invoice-details', {
      body: {
        invoiceId: invoiceId,
        envelopeUUID: invoiceId
      }
    });

    if (detailsError) throw detailsError;
    if (!detailsData?.success) {
      throw new Error(detailsData?.error || 'Nilvera fatura detayları alınamadı');
    }

    logger.debug('✅ Nilvera API Response detailsData:', detailsData);
    apiInvoiceDetails = detailsData.invoiceDetails;
  }

  // ========================================
  // 🔍 FULL API RESPONSE DEBUG
  // ========================================
  logger.debug('\n' + '='.repeat(80));
  logger.debug('🔍 FULL API RESPONSE FROM VERIBAN');
  logger.debug('Full invoice details loaded', {
    invoiceId: apiInvoiceDetails?.id,
    availableKeys: apiInvoiceDetails ? Object.keys(apiInvoiceDetails) : [],
    itemsCount: apiInvoiceDetails?.items?.length || 0
  });
  
  // Para birimi ve tutar bilgilerini detaylı logla
  logger.debug('💰 Currency and amounts check:', {
    currency: apiInvoiceDetails?.CurrencyCode || apiInvoiceDetails?.currency,
    exchangeRate: apiInvoiceDetails?.exchangeRate || apiInvoiceDetails?.exchange_rate,
    payableAmount: apiInvoiceDetails?.payableAmount,
    PayableAmount: apiInvoiceDetails?.PayableAmount,
    payableAmountTRY: apiInvoiceDetails?.payableAmountTRY,
    PayableAmountTRY: apiInvoiceDetails?.PayableAmountTRY,
    isPayableAmountArray: Array.isArray(apiInvoiceDetails?.PayableAmount),
  });
  
  // ========================================
  // 📄 RAW XML (İLK 2000 KARAKTER)
  // ========================================
  if (apiInvoiceDetails?.rawXml) {
    logger.debug('Raw XML content (first 2000 chars)', {
      xmlPreview: apiInvoiceDetails.rawXml.substring(0, 2000)
    });
  }
  
  // ========================================
  // 📦 ITEMS KONTROLÜ
  // ========================================
  if (apiInvoiceDetails?.items && apiInvoiceDetails.items.length > 0) {
    logger.debug('Items from API', {
      count: apiInvoiceDetails.items.length,
      firstItem: apiInvoiceDetails.items[0],
      allItems: apiInvoiceDetails.items
    });
  } else {
    logger.warn('No items found in API response');
  }

  // ========================================
  // 🔄 MAPPING ITEMS
  // ========================================
  const items = apiInvoiceDetails?.items?.map((item: any, index: number) => {
    logger.debug(`Mapping item ${index + 1}/${apiInvoiceDetails.items.length}`, { rawItem: item });
    
    return {
      id: item.id || `item-${index}`,
      line_number: item.lineNumber || item.line_number || index + 1,
      product_name: item.description || item.product_name || 'Açıklama yok',
      product_code: item.productCode || item.product_code,
      quantity: item.quantity || 1,
      unit: item.unit || 'adet',
      unit_price: item.unitPrice || item.unit_price || 0,
      tax_rate: item.vatRate || item.taxRate || item.tax_rate || 18,
      discount_rate: item.discountRate || item.discount_rate || 0,
      line_total: item.totalAmount || item.line_total || 0,
      tax_amount: item.vatAmount || item.taxAmount || item.tax_amount || 0,
      gtip_code: item.gtipCode || item.gtip_code,
      description: item.description
    };
  }) || [];
  
  logger.debug('Items mapping completed', {
    totalItems: items.length,
    items: items
  });

  // Detaylı tedarikçi bilgilerini çıkar
  const supplierInfo = apiInvoiceDetails?.supplierInfo || {};
  const accountingSupplierParty = apiInvoiceDetails?.AccountingSupplierParty || {};
  
  logger.debug('Supplier info from API', {
    supplierInfo,
    accountingSupplierParty,
    availableKeys: apiInvoiceDetails ? Object.keys(apiInvoiceDetails) : []
  });

  // Tedarikçi adı için önce supplierInfo'dan, sonra fallback'ler
  const supplierName =
    supplierInfo?.companyName ||
    apiInvoiceDetails?.supplierName ||
    apiInvoiceDetails?.SenderName ||
    accountingSupplierParty?.Party?.PartyName?.Name ||
    accountingSupplierParty?.PartyName?.Name ||
    'Tedarikçi';

  // Tedarikçi VKN için önce supplierInfo'dan, sonra fallback'ler
  const supplierTaxNumber =
    supplierInfo?.taxNumber ||
    apiInvoiceDetails?.supplierTaxNumber ||
    apiInvoiceDetails?.SenderTaxNumber ||
    apiInvoiceDetails?.SenderIdentifier ||
    apiInvoiceDetails?.TaxNumber ||
    accountingSupplierParty?.Party?.PartyIdentification?.ID ||
    accountingSupplierParty?.PartyIdentification?.ID ||
    accountingSupplierParty?.Party?.PartyTaxScheme?.TaxScheme?.ID ||
    '';

  logger.debug('✅ Extracted supplier info:', { supplierName, supplierTaxNumber });

  // Fatura tutar bilgilerini doğru alanlardan çek
  const subtotal = parseFloat(
    apiInvoiceDetails?.lineExtensionTotal ||
    apiInvoiceDetails?.TaxExclusiveAmount || 
    apiInvoiceDetails?.taxExclusiveAmount || 
    '0'
  );
  const taxTotal = parseFloat(
    apiInvoiceDetails?.taxTotalAmount ||
    apiInvoiceDetails?.TaxTotalAmount || 
    '0'
  );
  const totalAmount = parseFloat(
    apiInvoiceDetails?.payableAmount ||
    apiInvoiceDetails?.PayableAmount || 
    apiInvoiceDetails?.TotalAmount || 
    apiInvoiceDetails?.totalAmount || 
    '0'
  );
  
  logger.debug('💰 Invoice amounts:', { subtotal, taxTotal, totalAmount });

  // Fatura tarihini doğru şekilde parse et
  let rawInvoiceDate: string | null = null;
  if (integrator === 'veriban') {
    rawInvoiceDate = apiInvoiceDetails?.invoiceDate || 
                    apiInvoiceDetails?.InvoiceDate || 
                    null;
    logger.debug('📅 Veriban invoiceDate:', rawInvoiceDate);
  } else {
    rawInvoiceDate = apiInvoiceDetails?.IssueDate || 
                    apiInvoiceDetails?.issueDate || 
                    apiInvoiceDetails?.InvoiceDate || 
                    null;
    logger.debug('📅 Nilvera IssueDate:', rawInvoiceDate);
  }
  
  // Fallback: Eğer integrator'a göre bulunamadıysa, tüm alanları kontrol et
  if (!rawInvoiceDate) {
    rawInvoiceDate = apiInvoiceDetails?.invoiceDate || 
                    apiInvoiceDetails?.InvoiceDate || 
                    apiInvoiceDetails?.IssueDate || 
                    apiInvoiceDetails?.issueDate || 
                    null;
    logger.debug('📅 Fallback invoiceDate:', rawInvoiceDate);
  }
  
  // Tarih formatını normalize et
  let normalizedInvoiceDate: string;
  if (rawInvoiceDate) {
    logger.debug('📅 Raw invoice date value:', rawInvoiceDate, 'Type:', typeof rawInvoiceDate);
    if (rawInvoiceDate.includes('T')) {
      normalizedInvoiceDate = rawInvoiceDate;
      logger.debug('📅 Date is ISO format, using as-is');
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(rawInvoiceDate)) {
      normalizedInvoiceDate = `${rawInvoiceDate}T00:00:00Z`;
      logger.debug('📅 Date is YYYY-MM-DD format, converting to ISO');
    } else {
      const parsedDate = new Date(rawInvoiceDate);
      if (!isNaN(parsedDate.getTime())) {
        normalizedInvoiceDate = parsedDate.toISOString();
        logger.debug('📅 Date parsed successfully:', normalizedInvoiceDate);
      } else {
        logger.warn('⚠️ Invalid date format, using current date as fallback');
        normalizedInvoiceDate = new Date().toISOString();
      }
    }
    logger.debug('✅ Normalized invoice date:', normalizedInvoiceDate);
  } else {
    logger.warn('⚠️ No invoice date found in API response! Available keys:', Object.keys(apiInvoiceDetails || {}));
    logger.warn('⚠️ Using current date as fallback');
    normalizedInvoiceDate = new Date().toISOString();
  }

  // Vade tarihini de aynı şekilde parse et
  let rawDueDate: string | null = null;
  if (integrator === 'veriban') {
    rawDueDate = apiInvoiceDetails?.dueDate || 
                apiInvoiceDetails?.DueDate || 
                null;
  } else {
    rawDueDate = apiInvoiceDetails?.DueDate || 
                apiInvoiceDetails?.dueDate || 
                null;
  }
  
  let normalizedDueDate: string | null = null;
  if (rawDueDate) {
    logger.debug('📅 Raw due date value:', rawDueDate);
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
    logger.debug('✅ Normalized due date:', normalizedDueDate);
  } else {
    logger.debug('ℹ️ No due date found in API response');
  }

  // Döviz kuru bilgisini çek
  // UBL formatında: PricingExchangeRate/CalculationRate
  // Veriban formatında: exchangeRate, exchange_rate veya PricingExchangeRate
  let exchangeRate: number | null = null;
  
  // Önce XML'den direkt çekmeyi dene
  const rateFromXML = 
    apiInvoiceDetails?.exchangeRate ||
    apiInvoiceDetails?.exchange_rate ||
    apiInvoiceDetails?.ExchangeRate ||
    apiInvoiceDetails?.PricingExchangeRate?.CalculationRate ||
    apiInvoiceDetails?.pricingExchangeRate?.calculationRate ||
    null;
  
  if (rateFromXML) {
    exchangeRate = parseFloat(rateFromXML);
    logger.debug('💱 Exchange rate extracted from XML:', exchangeRate);
  }
  
  // Eğer XML'de kur yoksa ama hem döviz hem TL tutarları varsa, kuru hesapla
  if (!exchangeRate && totalAmount > 0) {
    // TL tutarlarını çekmeyi dene (daha sonra parse edeceğiz)
    const tryTotal = parseFloat(
      apiInvoiceDetails?.payableAmountTRY ||
      apiInvoiceDetails?.PayableAmountTRY ||
      apiInvoiceDetails?.totalAmountTRY ||
      '0'
    );
    
    if (tryTotal > 0) {
      // Kur = TL Tutar / Döviz Tutar
      exchangeRate = tryTotal / totalAmount;
      logger.debug('💱 Exchange rate calculated from amounts:', {
        tryTotal,
        foreignTotal: totalAmount,
        calculatedRate: exchangeRate
      });
    }
  }

  // TL karşılıklarını çek (dövizli faturalar için)
  // Farklı formatları destekle
  let subtotalTRY = 0;
  let taxTotalTRY = 0;
  let totalAmountTRY = 0;

  // 1. Direkt TRY alanlarından dene (çok fazla varyasyon var)
  subtotalTRY = parseFloat(
    apiInvoiceDetails?.lineExtensionAmountTRY ||
    apiInvoiceDetails?.TaxExclusiveAmountTRY ||
    apiInvoiceDetails?.subtotalTRY ||
    apiInvoiceDetails?.subtotal_try ||
    apiInvoiceDetails?.LineExtensionAmountTRY ||
    apiInvoiceDetails?.line_extension_amount_try ||
    apiInvoiceDetails?.taxExclusiveAmountTRY ||
    '0'
  );
  taxTotalTRY = parseFloat(
    apiInvoiceDetails?.taxTotalAmountTRY ||
    apiInvoiceDetails?.TaxTotalAmountTRY ||
    apiInvoiceDetails?.taxTotalTRY ||
    apiInvoiceDetails?.tax_total_try ||
    apiInvoiceDetails?.TaxAmountTRY ||
    apiInvoiceDetails?.tax_amount_try ||
    '0'
  );
  totalAmountTRY = parseFloat(
    apiInvoiceDetails?.payableAmountTRY ||
    apiInvoiceDetails?.PayableAmountTRY ||
    apiInvoiceDetails?.totalAmountTRY ||
    apiInvoiceDetails?.total_amount_try ||
    apiInvoiceDetails?.payable_amount_try ||
    apiInvoiceDetails?.TaxInclusiveAmountTRY ||
    '0'
  );
  
  logger.debug('💰 TRY amounts from direct fields:', { subtotalTRY, taxTotalTRY, totalAmountTRY });

  // 2. LegalMonetaryTotal içinden dene (Veriban formatı)
  if (apiInvoiceDetails?.LegalMonetaryTotal) {
    const legalMonetary = apiInvoiceDetails.LegalMonetaryTotal;
    
    // LineExtensionAmount için
    if (Array.isArray(legalMonetary?.LineExtensionAmount)) {
      const tryAmount = legalMonetary.LineExtensionAmount.find((amt: any) => 
        amt.$?.currencyID === 'TRY' || amt.currencyID === 'TRY'
      );
      if (tryAmount) {
        const val = parseFloat(tryAmount._ || tryAmount.value || tryAmount);
        if (!isNaN(val) && val > 0) subtotalTRY = val;
      }
    }
    
    // PayableAmount için
    if (Array.isArray(legalMonetary?.PayableAmount)) {
      const tryAmount = legalMonetary.PayableAmount.find((amt: any) => 
        amt.$?.currencyID === 'TRY' || amt.currencyID === 'TRY'
      );
      if (tryAmount) {
        const val = parseFloat(tryAmount._ || tryAmount.value || tryAmount);
        if (!isNaN(val) && val > 0) totalAmountTRY = val;
      }
    }
  }

  // 3. TaxTotal içinden dene
  if (apiInvoiceDetails?.TaxTotal) {
    const taxTotal = apiInvoiceDetails.TaxTotal;
    
    if (Array.isArray(taxTotal?.TaxAmount)) {
      const tryAmount = taxTotal.TaxAmount.find((amt: any) => 
        amt.$?.currencyID === 'TRY' || amt.currencyID === 'TRY'
      );
      if (tryAmount) {
        const val = parseFloat(tryAmount._ || tryAmount.value || tryAmount);
        if (!isNaN(val) && val > 0) taxTotalTRY = val;
      }
    }
  }

  // 4. Eğer döviz kuru varsa ve TRY tutarı yoksa, hesapla
  if (exchangeRate && exchangeRate > 0) {
    if (subtotalTRY === 0 && subtotal > 0) {
      subtotalTRY = subtotal * exchangeRate;
      logger.debug('💱 TRY subtotal calculated from exchange rate:', subtotalTRY);
    }
    if (taxTotalTRY === 0 && taxTotal > 0) {
      taxTotalTRY = taxTotal * exchangeRate;
      logger.debug('💱 TRY tax calculated from exchange rate:', taxTotalTRY);
    }
    if (totalAmountTRY === 0 && totalAmount > 0) {
      totalAmountTRY = totalAmount * exchangeRate;
      logger.debug('💱 TRY total calculated from exchange rate:', totalAmountTRY);
    }
  } 
  // 5. Eğer kur yoksa ama TRY tutarları varsa, kuru ters hesapla
  else if (!exchangeRate && totalAmountTRY > 0 && totalAmount > 0) {
    exchangeRate = totalAmountTRY / totalAmount;
    logger.debug('💱 Exchange rate reverse-calculated:', {
      tryTotal: totalAmountTRY,
      foreignTotal: totalAmount,
      rate: exchangeRate
    });
  }
  
  logger.debug('💰 TL karşılıkları (final):', { 
    subtotalTRY: subtotalTRY > 0 ? subtotalTRY.toFixed(2) : 'yok',
    taxTotalTRY: taxTotalTRY > 0 ? taxTotalTRY.toFixed(2) : 'yok',
    totalAmountTRY: totalAmountTRY > 0 ? totalAmountTRY.toFixed(2) : 'yok',
    exchangeRate: exchangeRate ? exchangeRate.toFixed(4) : 'yok'
  });

  const invoiceDetails: EInvoiceDetails = {
    id: invoiceId,
    invoice_number: apiInvoiceDetails?.InvoiceNumber || apiInvoiceDetails?.invoiceNumber || apiInvoiceDetails?.ID || invoiceId,
    supplier_name: supplierName,
    supplier_tax_number: supplierTaxNumber,
    invoice_date: normalizedInvoiceDate,
    due_date: normalizedDueDate,
    currency: apiInvoiceDetails?.CurrencyCode || apiInvoiceDetails?.currency || 'TRY',
    exchange_rate: exchangeRate ? parseFloat(exchangeRate) : undefined,
    subtotal: subtotal,
    tax_total: taxTotal,
    total_amount: totalAmount,
    // TL karşılıkları (sadece 0'dan büyükse ekle)
    subtotal_try: subtotalTRY > 0 ? subtotalTRY : undefined,
    tax_total_try: taxTotalTRY > 0 ? taxTotalTRY : undefined,
    total_amount_try: totalAmountTRY > 0 ? totalAmountTRY : undefined,
    items,
    supplier_details: {
      company_name: supplierName,
      tax_number: supplierTaxNumber,
      trade_registry_number: supplierInfo?.tradeRegistryNumber || null,
      mersis_number: supplierInfo?.mersisNumber || null,
      email: supplierInfo?.email || null,
      phone: supplierInfo?.phone || null,
      website: supplierInfo?.website || null,
      fax: supplierInfo?.fax || null,
      address: {
        street: supplierInfo?.address?.street || null,
        district: supplierInfo?.address?.district || null,
        city: supplierInfo?.address?.city || null,
        postal_code: supplierInfo?.address?.postalCode || supplierInfo?.address?.postal_code || null,
        country: supplierInfo?.address?.country || 'Türkiye'
      },
      bank_info: {
        bank_name: supplierInfo?.bankInfo?.bankName || null,
        iban: supplierInfo?.bankInfo?.iban || null,
        account_number: supplierInfo?.bankInfo?.accountNumber || null
      }
    }
  };

  logger.debug('Invoice details mapped successfully', { invoiceDetails });

  return invoiceDetails;
};

