/**
 * UBL-TR XML Generator Utility
 * 
 * This module provides utilities for generating UBL-TR XML invoice format
 * from sales invoice data for Veriban e-invoice integration.
 */

export interface SalesInvoiceData {
  id: string;
  fatura_no: string | null;
  fatura_tarihi: string;
  issue_time?: string | null;
  vade_tarihi?: string | null;
  invoice_type?: string | null;
  invoice_profile?: string | null;
  para_birimi: string;
  exchange_rate?: number | null;
  ara_toplam: number;
  kdv_tutari: number;
  indirim_tutari: number;
  toplam_tutar: number;
  aciklama?: string | null;
  notlar?: string | null;
  companies?: {
    name?: string;
    tax_number?: string;
    tax_office?: string;
    address?: string;
    city?: string;
    district?: string;
    postal_code?: string;
    country?: string;
    phone?: string;
    email?: string;
    website?: string;
  };
  customers?: {
    name?: string;
    company?: string;
    tax_number?: string;
    tax_office?: string;
    address?: string;
    city?: string;
    district?: string;
    postal_code?: string;
    country?: string;
    mobile_phone?: string;
    office_phone?: string;
    email?: string;
    is_einvoice_mukellef?: boolean;
    einvoice_alias_name?: string;
  };
  sales_invoice_items?: Array<{
    id?: string;
    urun_adi: string;
    miktar: number;
    birim: string;
    birim_fiyat: number;
    kdv_orani: number;
    indirim_orani?: number | null;
    satir_toplami: number;
    kdv_tutari?: number;
    gtip_kodu?: string | null;
  }>;
}

/**
 * Map unit codes to UBL-TR standard codes
 */
function mapUnitToUBLTR(unit: string): string {
  if (!unit) return 'C62'; // Default: adet
  
  const unitUpper = unit.toUpperCase();
  const unitLower = unit.toLowerCase();
  
  // UBL-TR kodları direkt döndür
  const ubltrCodes: Record<string, string> = {
    'C62': 'C62', 'MTR': 'MTR', 'MTK': 'MTK', 'MTQ': 'MTQ',
    'KGM': 'KGM', 'GRM': 'GRM', 'LTR': 'LTR', 'MLT': 'MLT',
    'HUR': 'HUR', 'DAY': 'DAY', 'MON': 'MON', 'WEE': 'WEE',
    'PA': 'PA', 'CT': 'CT', 'PK': 'PK', 'SET': 'SET',
    'TNE': 'TNE', 'BG': 'BG', 'BX': 'BX', 'EA': 'EA',
    'PC': 'PC', 'PR': 'PR', 'TU': 'TU', 'BO': 'BO',
    'CN': 'CN', 'DZN': 'DZN', 'GRO': 'GRO', 'ANN': 'ANN'
  };
  if (ubltrCodes[unitUpper]) return unitUpper;
  
  // Dropdown değerlerini ve okunabilir formatları UBL-TR kodlarına çevir
  const unitMap: Record<string, string> = {
    'adet': 'C62', 'kilogram': 'KGM', 'gram': 'GRM',
    'metre': 'MTR', 'metrekare': 'MTK', 'metreküp': 'MTQ',
    'litre': 'LTR', 'mililitre': 'MLT', 'paket': 'PA', 'kutu': 'CT',
    'saat': 'HUR', 'gün': 'DAY', 'hafta': 'WEE', 'ay': 'MON', 'yıl': 'ANN',
    'kg': 'KGM', 'g': 'GRM', 'm': 'MTR', 'm2': 'MTK', 'm3': 'MTQ',
    'lt': 'LTR', 'ml': 'MLT', 'ton': 'TNE', 'takım': 'SET',
    'Adet': 'C62', 'Kg': 'KGM', 'Lt': 'LTR', 'M': 'MTR',
    'M2': 'MTK', 'M3': 'MTQ', 'Paket': 'PA', 'Kutu': 'CT'
  };
  
  return unitMap[unitLower] || unitMap[unit] || 'C62';
}

/**
 * Escape XML special characters
 */
function escapeXml(unsafe: string): string {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Format date to YYYY-MM-DD format
 */
function formatDate(dateString: string): string {
  if (!dateString) return new Date().toISOString().split('T')[0];
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
}

/**
 * Format time to HH:mm:ss format
 */
function formatTime(timeString?: string | null): string {
  if (!timeString) {
    const now = new Date();
    return now.toTimeString().split(' ')[0].substring(0, 8);
  }
  // If time is already in HH:mm:ss format, return as is
  if (timeString.match(/^\d{2}:\d{2}:\d{2}$/)) {
    return timeString;
  }
  // If time is in HH:mm format, add seconds
  if (timeString.match(/^\d{2}:\d{2}$/)) {
    return timeString + ':00';
  }
  return timeString;
}

/**
 * Generate ETTN (UUID) for invoice
 */
function generateETTN(): string {
  // Generate UUID v4
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Generate UBL-TR XML from sales invoice data
 */
export function generateUBLTRXML(invoice: SalesInvoiceData, ettn?: string): string {
  // Generate ETTN if not provided
  const invoiceETTN = ettn || generateETTN();
  
  // Format dates
  const issueDate = formatDate(invoice.fatura_tarihi);
  const issueTime = formatTime(invoice.issue_time);
  const dueDate = invoice.vade_tarihi ? formatDate(invoice.vade_tarihi) : null;
  
  // Log issue time for debugging
  console.log('🕐 [UBL Generator] Issue time:', {
    original: invoice.issue_time,
    formatted: issueTime,
    issueDate: issueDate
  });
  
  // Invoice type and profile
  const invoiceType = invoice.invoice_type || 'SATIS';
  const invoiceProfile = invoice.invoice_profile || 'TEMELFATURA';
  
  // Currency
  const currency = invoice.para_birimi || 'TRY';
  
  // Company (Supplier) info
  const company = invoice.companies || {};
  const companyName = escapeXml(company.name || 'Şirket Adı');
  const companyTaxNumber = escapeXml(company.tax_number || '');
  const companyTaxOffice = escapeXml(company.tax_office || '');
  const companyAddress = escapeXml(company.address || '');
  // CityName is mandatory for Veriban - use default if empty
  const companyCity = escapeXml(company.city || 'İstanbul');
  const companyDistrict = escapeXml(company.district || '');
  const companyPostalCode = escapeXml(company.postal_code || '');
  const companyCountry = escapeXml(company.country || 'Türkiye');
  const companyPhone = escapeXml(company.phone || '');
  const companyEmail = escapeXml(company.email || '');
  const companyWebsite = escapeXml(company.website || '');
  
  // Customer (Buyer) info
  const customer = invoice.customers || {};
  const customerName = escapeXml(customer.name || customer.company || 'Müşteri Adı');
  const customerTaxNumber = escapeXml(customer.tax_number || '');
  const customerTaxOffice = escapeXml(customer.tax_office || '');
  const customerAddress = escapeXml(customer.address || '');
  // CityName is mandatory for Veriban - use default if empty
  const customerCity = escapeXml(customer.city || 'İstanbul');
  const customerDistrict = escapeXml(customer.district || '');
  const customerPostalCode = escapeXml(customer.postal_code || '');
  const customerCountry = escapeXml(customer.country || 'Türkiye');
  const customerPhone = escapeXml(customer.mobile_phone || customer.office_phone || '');
  const customerEmail = escapeXml(customer.email || '');
  
  // Invoice items
  const items = invoice.sales_invoice_items || [];
  
  // Calculate totals
  const lineExtensionAmount = invoice.ara_toplam || 0;
  const taxExclusiveAmount = invoice.ara_toplam || 0;
  const taxInclusiveAmount = invoice.toplam_tutar || 0;
  const payableAmount = invoice.toplam_tutar || 0;
  const taxTotal = invoice.kdv_tutari || 0;
  const allowanceTotalAmount = invoice.indirim_tutari || 0;
  
  // Group items by VAT rate for TaxTotal
  const vatGroups: Record<number, { base: number; amount: number }> = {};
  items.forEach(item => {
    const vatRate = item.kdv_orani || 0;
    const lineTotal = item.satir_toplami || 0;
    const vatAmount = item.kdv_tutari || (lineTotal * vatRate / (100 + vatRate));
    const baseAmount = lineTotal - vatAmount;

    if (!vatGroups[vatRate]) {
      vatGroups[vatRate] = { base: 0, amount: 0 };
    }
    vatGroups[vatRate].base += baseAmount;
    vatGroups[vatRate].amount += vatAmount;
  });

  // Validate and clean invoice number
  // Filter out invalid values like DOKUMAN, TASLAK, MESSAGE, etc.
  const invalidInvoiceNumbers = ['DOKUMAN', 'TASLAK', 'MESSAGE', 'DESCRIPTION', 'ERROR', 'STATE', 'ANSWER', 'NULL', 'UNDEFINED'];
  let invoiceNumber = invoice.fatura_no || '';

  // Check if invoice number is invalid or empty
  if (!invoiceNumber || invalidInvoiceNumbers.includes(invoiceNumber.toUpperCase()) || invoiceNumber.trim() === '') {
    // Log warning for missing invoice number
    console.warn('⚠️ [UBL Generator] Fatura numarası bulunamadı veya geçersiz:', {
      invoiceId: invoice.id,
      fatura_no: invoice.fatura_no,
      fatura_tarihi: invoice.fatura_tarihi
    });
    
    // Generate a temporary invoice number based on date and invoice ID
    // GİB formatı: SERI(3) + YIL(4) + SIRA(9) = 16 karakter
    // NOT: Bu geçici bir çözümdür. Fatura oluşturulurken otomatik numara üretilmeli.
    const date = new Date(invoice.fatura_tarihi);
    const year = date.getFullYear().toString();
    const serie = 'FAT'; // Varsayılan seri
    // UUID'den 9 karakterlik sıra numarası oluştur (ilk 9 karakter, tire yok)
    const sequence = invoice.id.substring(0, 9).replace(/-/g, '').padEnd(9, '0');
    invoiceNumber = `${serie}${year}${sequence}`;
    
    // GİB formatı kontrolü: 16 karakter olmalı
    if (invoiceNumber.length !== 16) {
      console.warn('⚠️ [UBL Generator] Geçici fatura numarası 16 karakter değil:', invoiceNumber, 'Uzunluk:', invoiceNumber.length);
      // 16 karaktere tamamla veya kısalt
      if (invoiceNumber.length > 16) {
        invoiceNumber = invoiceNumber.substring(0, 16);
      } else {
        invoiceNumber = invoiceNumber.padEnd(16, '0');
      }
    }
    
    console.warn('⚠️ [UBL Generator] Geçici fatura numarası oluşturuldu (GİB formatı):', invoiceNumber);
  } else {
    // GİB formatı kontrolü: 16 karakter olmalı
    if (invoiceNumber.length !== 16) {
      console.warn('⚠️ [UBL Generator] Fatura numarası GİB formatına uygun değil (16 karakter değil):', invoiceNumber, 'Uzunluk:', invoiceNumber.length);
    } else {
      // Format kontrolü: SERI(3) + YIL(4) + SIRA(9)
      const serie = invoiceNumber.substring(0, 3);
      const year = invoiceNumber.substring(3, 7);
      const sequence = invoiceNumber.substring(7);
      
      // Yıl kontrolü
      const currentYear = new Date(invoice.fatura_tarihi).getFullYear().toString();
      if (year !== currentYear) {
        console.warn('⚠️ [UBL Generator] Fatura numarasındaki yıl fatura tarihi ile uyuşmuyor:', year, 'vs', currentYear);
      }
      
      // Sıra numarası kontrolü (sayı olmalı)
      if (!/^\d{9}$/.test(sequence)) {
        console.warn('⚠️ [UBL Generator] Fatura numarasındaki sıra numarası 9 haneli sayı değil:', sequence);
      }
      
      console.log('✅ [UBL Generator] Fatura numarası kullanılıyor (GİB formatı):', invoiceNumber, `[${serie}][${year}][${sequence}]`);
    }
  }

  // Build XML
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:CustomizationID>TR1.2</cbc:CustomizationID>
  <cbc:ProfileID>${escapeXml(invoiceProfile)}</cbc:ProfileID>
  <cbc:ID>${escapeXml(invoiceNumber)}</cbc:ID>
  <cbc:UUID>${invoiceETTN}</cbc:UUID>
  <cbc:IssueDate>${issueDate}</cbc:IssueDate>
  <cbc:IssueTime>${issueTime}</cbc:IssueTime>`;
  
  if (dueDate) {
    xml += `\n  <cbc:DueDate>${dueDate}</cbc:DueDate>`;
  }
  
  xml += `
  <cbc:InvoiceTypeCode>${escapeXml(invoiceType)}</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>${currency}</cbc:DocumentCurrencyCode>
  <cbc:LineCountNumeric>${items.length}</cbc:LineCountNumeric>`;
  
  // AccountingSupplierParty (Satıcı)
  xml += `
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cbc:WebsiteURI>${companyWebsite}</cbc:WebsiteURI>
      <cac:PartyIdentification>
        <cbc:ID schemeID="VKN">${companyTaxNumber}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyName>
        <cbc:Name>${companyName}</cbc:Name>
      </cac:PartyName>
      <cac:PostalAddress>
        <cbc:StreetName>${companyAddress}</cbc:StreetName>
        <cbc:CityName>${companyCity}</cbc:CityName>
        <cbc:CitySubdivisionName>${companyDistrict || companyCity}</cbc:CitySubdivisionName>
        <cbc:PostalZone>${companyPostalCode}</cbc:PostalZone>
        <cac:Country>
          <cbc:Name>${companyCountry}</cbc:Name>
        </cac:Country>
      </cac:PostalAddress>
      <cac:PartyTaxScheme>
        <cac:TaxScheme>
          <cbc:Name>${companyTaxOffice}</cbc:Name>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>
      <cac:Contact>
        <cbc:Telephone>${companyPhone}</cbc:Telephone>
        <cbc:ElectronicMail>${companyEmail}</cbc:ElectronicMail>
      </cac:Contact>
    </cac:Party>
  </cac:AccountingSupplierParty>`;
  
  // AccountingCustomerParty (Alıcı)
  xml += `
  <cac:AccountingCustomerParty>
    <cac:Party>`;

  // PartyIdentification: VKN or TCKN
  // Note: For individuals (TCKN), we need to add cac:Person element as well
  const isTCKN = customerTaxNumber && customerTaxNumber.length === 11;
  const isVKN = customerTaxNumber && customerTaxNumber.length === 10;

  if (isTCKN || isVKN) {
    xml += `
      <cac:PartyIdentification>
        <cbc:ID schemeID="${isTCKN ? 'TCKN' : 'VKN'}">${customerTaxNumber}</cbc:ID>
      </cac:PartyIdentification>`;
  }

  xml += `
      <cac:PartyName>
        <cbc:Name>${customerName}</cbc:Name>
      </cac:PartyName>
      <cac:PostalAddress>
        <cbc:StreetName>${customerAddress}</cbc:StreetName>
        <cbc:CityName>${customerCity}</cbc:CityName>
        <cbc:CitySubdivisionName>${customerDistrict || customerCity}</cbc:CitySubdivisionName>
        <cbc:PostalZone>${customerPostalCode}</cbc:PostalZone>
        <cac:Country>
          <cbc:Name>${customerCountry}</cbc:Name>
        </cac:Country>
      </cac:PostalAddress>`;

  if (customerTaxOffice) {
    xml += `
      <cac:PartyTaxScheme>
        <cac:TaxScheme>
          <cbc:Name>${customerTaxOffice}</cbc:Name>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>`;
  }

  // For TCKN (individuals), add Person element as required by Veriban
  if (isTCKN) {
    // Split customer name into first and last name
    const nameParts = customerName.split(' ');
    const firstName = nameParts.slice(0, -1).join(' ') || customerName;
    const familyName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';

    xml += `
      <cac:Person>
        <cbc:FirstName>${firstName}</cbc:FirstName>
        <cbc:FamilyName>${familyName}</cbc:FamilyName>
      </cac:Person>`;
  }

  if (customerPhone || customerEmail) {
    xml += `
      <cac:Contact>
        <cbc:Telephone>${customerPhone}</cbc:Telephone>
        <cbc:ElectronicMail>${customerEmail}</cbc:ElectronicMail>
      </cac:Contact>`;
  }

  xml += `
    </cac:Party>
  </cac:AccountingCustomerParty>`;
  
  // Invoice Lines
  items.forEach((item, index) => {
    const lineNumber = index + 1;
    const quantity = item.miktar || 0;
    const unitPrice = item.birim_fiyat || 0;
    const vatRate = item.kdv_orani || 0;
    const discountRate = item.indirim_orani || 0;
    const lineTotal = item.satir_toplami || 0;
    const vatAmount = item.kdv_tutari || (lineTotal * vatRate / (100 + vatRate));
    const baseAmount = lineTotal - vatAmount;
    const unitCode = mapUnitToUBLTR(item.birim || 'C62');
    const productName = escapeXml(item.urun_adi || 'Ürün');
    
    xml += `
  <cac:InvoiceLine>
    <cbc:ID>${lineNumber}</cbc:ID>
    <cbc:InvoicedQuantity unitCode="${unitCode}">${quantity.toFixed(2)}</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="${currency}">${baseAmount.toFixed(2)}</cbc:LineExtensionAmount>
    <cac:Item>
      <cbc:Name>${productName}</cbc:Name>`;
    
    if (item.gtip_kodu) {
      xml += `\n      <cac:CommodityClassification>
        <cbc:ItemClassificationCode listID="GTIP">${escapeXml(item.gtip_kodu)}</cbc:ItemClassificationCode>
      </cac:CommodityClassification>`;
    }
    
    xml += `
    </cac:Item>
    <cac:Price>
      <cbc:PriceAmount currencyID="${currency}">${unitPrice.toFixed(2)}</cbc:PriceAmount>
    </cac:Price>`;
    
    if (vatRate > 0) {
      xml += `
    <cac:TaxTotal>
      <cbc:TaxAmount currencyID="${currency}">${vatAmount.toFixed(2)}</cbc:TaxAmount>
      <cac:TaxSubtotal>
        <cbc:TaxableAmount currencyID="${currency}">${baseAmount.toFixed(2)}</cbc:TaxableAmount>
        <cbc:TaxAmount currencyID="${currency}">${vatAmount.toFixed(2)}</cbc:TaxAmount>
        <cac:TaxCategory>
          <cbc:TaxExemptionReasonCode>VAT</cbc:TaxExemptionReasonCode>
          <cbc:Percent>${vatRate.toFixed(2)}</cbc:Percent>
          <cac:TaxScheme>
            <cbc:Name>KDV</cbc:Name>
            <cbc:TaxTypeCode>0015</cbc:TaxTypeCode>
          </cac:TaxScheme>
        </cac:TaxCategory>
      </cac:TaxSubtotal>
    </cac:TaxTotal>`;
    }
    
    xml += `
  </cac:InvoiceLine>`;
  });
  
  // Tax Total
  xml += `
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="${currency}">${taxTotal.toFixed(2)}</cbc:TaxAmount>`;
  
  Object.entries(vatGroups).forEach(([rate, group]) => {
    const vatRate = parseFloat(rate);
    xml += `
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="${currency}">${group.base.toFixed(2)}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="${currency}">${group.amount.toFixed(2)}</cbc:TaxAmount>
      <cac:TaxCategory>
        <cbc:TaxExemptionReasonCode>VAT</cbc:TaxExemptionReasonCode>
        <cbc:Percent>${vatRate.toFixed(2)}</cbc:Percent>
        <cac:TaxScheme>
          <cbc:Name>KDV</cbc:Name>
          <cbc:TaxTypeCode>0015</cbc:TaxTypeCode>
        </cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>`;
  });
  
  xml += `
  </cac:TaxTotal>`;
  
  // Legal Monetary Total
  xml += `
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="${currency}">${lineExtensionAmount.toFixed(2)}</cbc:LineExtensionAmount>`;
  
  if (allowanceTotalAmount > 0) {
    xml += `\n    <cbc:AllowanceTotalAmount currencyID="${currency}">${allowanceTotalAmount.toFixed(2)}</cbc:AllowanceTotalAmount>`;
  }
  
  xml += `
    <cbc:TaxExclusiveAmount currencyID="${currency}">${taxExclusiveAmount.toFixed(2)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="${currency}">${taxInclusiveAmount.toFixed(2)}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="${currency}">${payableAmount.toFixed(2)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>`;
  
  // Notes
  if (invoice.notlar || invoice.aciklama) {
    xml += `
  <cac:Note>`;
    if (invoice.notlar) {
      xml += `\n    <cbc:Note>${escapeXml(invoice.notlar)}</cbc:Note>`;
    }
    if (invoice.aciklama) {
      xml += `\n    <cbc:Note>${escapeXml(invoice.aciklama)}</cbc:Note>`;
    }
    xml += `
  </cac:Note>`;
  }
  
  xml += `
</Invoice>`;
  
  return xml;
}

