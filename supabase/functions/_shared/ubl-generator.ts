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
  
  // Invoice type and profile
  const invoiceType = invoice.invoice_type || 'SATIS';
  const invoiceProfile = invoice.invoice_profile || 'TICARIFATURA';
  
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

  // Validate invoice number
  const invalidInvoiceNumbers = ['DOKUMAN', 'TASLAK', 'MESSAGE', 'DESCRIPTION', 'ERROR', 'STATE', 'ANSWER', 'NULL', 'UNDEFINED'];
  let invoiceNumber = invoice.fatura_no || '';

  // Generate temporary invoice number if invalid
  if (!invoiceNumber || invalidInvoiceNumbers.includes(invoiceNumber.toUpperCase()) || invoiceNumber.trim() === '') {
    const date = new Date(invoice.fatura_tarihi);
    const year = date.getFullYear().toString();
    const serie = 'FAT';
    const sequence = invoice.id.substring(0, 9).replace(/-/g, '').padEnd(9, '0');
    invoiceNumber = `${serie}${year}${sequence}`;
    
    if (invoiceNumber.length !== 16) {
      invoiceNumber = invoiceNumber.length > 16 
        ? invoiceNumber.substring(0, 16) 
        : invoiceNumber.padEnd(16, '0');
    }
  }

  // Build XML with proper E-Archive structure
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
         xmlns:ccts="urn:un:unece:uncefact:documentation:2"
         xmlns:qdt="urn:oasis:names:specification:ubl:schema:xsd:QualifiedDatatypes-2"
         xmlns:udt="urn:un:unece:uncefact:data:specification:UnqualifiedDataTypesSchemaModule:2"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
  <cbc:CustomizationID>TR1.2</cbc:CustomizationID>
  <cbc:ProfileID>${invoiceProfile}</cbc:ProfileID>`;
  
  xml += `
  <cbc:ID>${escapeXml(invoiceNumber)}</cbc:ID>
  <cbc:CopyIndicator>false</cbc:CopyIndicator>
  <cbc:UUID>${invoiceETTN}</cbc:UUID>
  <cbc:IssueDate>${issueDate}</cbc:IssueDate>
  <cbc:IssueTime>${issueTime}</cbc:IssueTime>`;
  
  xml += `
  <cbc:InvoiceTypeCode>${escapeXml(invoiceType)}</cbc:InvoiceTypeCode>`;
  
  // Add Note if exists (yazıyla tutar)
  if (invoice.notlar) {
    xml += `\n  <cbc:Note>${escapeXml(invoice.notlar)}</cbc:Note>`;
  }
  
  // Add DueDate if exists (after Note, before DocumentCurrencyCode)
  if (dueDate) {
    xml += `\n  <cbc:DueDate>${dueDate}</cbc:DueDate>`;
  }
  
  xml += `
  <cbc:DocumentCurrencyCode listAgencyName="United Nations Economic Commission for Europe" listID="ISO 4217 Alpha" listName="Currency" listVersionID="2001">${currency}</cbc:DocumentCurrencyCode>
  <cbc:LineCountNumeric>${items.length}</cbc:LineCountNumeric>`;
  
  // Signature element (VERİBAN mali mühür bilgisi - E-Arşiv için zorunlu)
  // Not: Gerçek imza Veriban tarafından atılır, burada sadece imzalayan taraf bilgisi
  xml += `
  <cac:Signature>
    <cbc:ID schemeID="VKN">9240481875</cbc:ID>
    <cac:SignatoryParty>
      <cac:PartyIdentification>
        <cbc:ID schemeID="VKN">9240481875</cbc:ID>
      </cac:PartyIdentification>
      <cac:PostalAddress>
        <cbc:CityName>İstanbul</cbc:CityName>
        <cac:Country>
          <cbc:Name>Türkiye</cbc:Name>
        </cac:Country>
      </cac:PostalAddress>
    </cac:SignatoryParty>
    <cac:DigitalSignatureAttachment>
      <cac:ExternalReference>
        <cbc:URI>#Signature</cbc:URI>
      </cac:ExternalReference>
    </cac:DigitalSignatureAttachment>
  </cac:Signature>`;
  
  // AdditionalDocumentReference (İrsaliye yerine geçer notu - E-Arşiv için)
  xml += `
  <cac:AdditionalDocumentReference>
    <cbc:ID schemeID="XSLTDISPATCH">İrsaliye yerine geçer.</cbc:ID>
    <cbc:IssueDate>${issueDate}</cbc:IssueDate>
  </cac:AdditionalDocumentReference>`;
  
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
  // E-Arşiv için de VKN/TCKN eklenmeli (Veriban şart koşuyor)
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

  // ⭐ TCKN için Person elementi ZORUNLU (E-Arşiv için de gerekli!)
  // Veriban kuralı: schemeID=TCKN ise cac:Person bulunmalıdır
  if (isTCKN) {
    // Split customer name into first and last name
    const nameParts = customerName.split(' ');
    const firstName = nameParts.slice(0, -1).join(' ') || customerName;
    const familyName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';

    xml += `
      <cac:Person>
        <cbc:FirstName>${escapeXml(firstName)}</cbc:FirstName>
        <cbc:FamilyName>${escapeXml(familyName)}</cbc:FamilyName>
      </cac:Person>`;
  }

  // ⭐ Müşteri vergi dairesi - E-Arşiv için EKLEME (opsiyonel)
  // E-Arşiv faturalarda müşteri vergi dairesi eklenmez
  if (customerTaxOffice && invoiceProfile !== 'EARSIVFATURA') {
    xml += `
      <cac:PartyTaxScheme>
        <cac:TaxScheme>
          <cbc:Name>${customerTaxOffice}</cbc:Name>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>`;
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

/**
 * Generate E-Archive UBL-TR XML from sales invoice data
 * E-Arşiv faturaları için özel XML üretici
 * 
 * FARKLAR (E-Fatura'dan):
 * - ProfileID: EARSIVFATURA (zorunlu)
 * - cac:Signature: VERİBAN mali mühür bilgisi
 * - cac:AdditionalDocumentReference: İrsaliye notu
 * - Müşteri PartyTaxScheme E-Arşiv için eklenmez
 * - TCKN için cac:Person zorunlu
 * 
 * @param invoice - Sales invoice data
 * @param ettn - Invoice UUID (ETTN)
 * @returns E-Archive UBL-TR XML string
 */
export function generateEArchiveUBLTRXML(invoice: SalesInvoiceData, ettn?: string): string {
  // Generate ETTN if not provided
  const invoiceETTN = ettn || generateETTN();
  
  // VERİBAN sabit bilgileri (E-Arşiv için zorunlu)
  const VERIBAN_VKN = '9240481875';
  const VERIBAN_CITY = 'İstanbul';
  const VERIBAN_COUNTRY = 'Türkiye';
  
  // Format dates
  const issueDate = formatDate(invoice.fatura_tarihi);
  const issueTime = formatTime(invoice.issue_time);
  
  // Invoice type
  const invoiceType = invoice.invoice_type || 'SATIS';
  
  // Currency
  const currency = invoice.para_birimi || 'TRY';
  
  // Company (Supplier) info
  const company = invoice.companies || {};
  const companyName = escapeXml(company.name || 'Şirket Adı');
  const companyTaxNumber = escapeXml(company.tax_number || '');
  const companyTaxOffice = escapeXml(company.tax_office || '');
  const companyAddress = escapeXml(company.address || '');
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

  // Validate invoice number
  const invalidInvoiceNumbers = ['DOKUMAN', 'TASLAK', 'MESSAGE', 'DESCRIPTION', 'ERROR', 'STATE', 'ANSWER', 'NULL', 'UNDEFINED'];
  let invoiceNumber = invoice.fatura_no || '';

  // E-Arşiv faturalar için fatura numarası "EAR" ile başlamalı
  // Eğer farklı bir prefix ile başlıyorsa, düzelt
  const isEArchiveInvoice = true; // Bu fonksiyon sadece E-Arşiv için çağrılıyor
  const requiredPrefix = 'EAR';
  
  // Generate temporary invoice number if invalid or wrong prefix
  const needsRegeneration = !invoiceNumber || 
                           invalidInvoiceNumbers.includes(invoiceNumber.toUpperCase()) || 
                           invoiceNumber.trim() === '' ||
                           (isEArchiveInvoice && !invoiceNumber.toUpperCase().startsWith(requiredPrefix));
  
  if (needsRegeneration) {
    const date = new Date(invoice.fatura_tarihi);
    const year = date.getFullYear().toString();
    const serie = requiredPrefix;
    
    // Eğer mevcut numara varsa ama yanlış prefix ise, sadece prefix'i değiştir
    if (invoiceNumber && invoiceNumber.length >= 7) {
      // Mevcut numaradan yıl ve sıra numarasını al
      const yearMatch = invoiceNumber.match(/\d{4}/);
      const sequenceMatch = invoiceNumber.match(/\d{9,}/);
      
      if (yearMatch && sequenceMatch) {
        const extractedYear = yearMatch[0];
        const extractedSequence = sequenceMatch[0].substring(0, 9).padStart(9, '0');
        invoiceNumber = `${requiredPrefix}${extractedYear}${extractedSequence}`;
      } else {
        // Fallback: invoice ID'den sıra numarası oluştur
        const sequence = invoice.id.substring(0, 9).replace(/-/g, '').padEnd(9, '0');
        invoiceNumber = `${serie}${year}${sequence}`;
      }
    } else {
      // Tamamen yeni numara oluştur
      const sequence = invoice.id.substring(0, 9).replace(/-/g, '').padEnd(9, '0');
      invoiceNumber = `${serie}${year}${sequence}`;
    }
    
    if (invoiceNumber.length !== 16) {
      invoiceNumber = invoiceNumber.length > 16 
        ? invoiceNumber.substring(0, 16) 
        : invoiceNumber.padEnd(16, '0');
    }
    
    console.log('⚠️ [E-Arşiv] Fatura numarası düzeltildi:', invoice.fatura_no, '->', invoiceNumber);
  }

  // Build XML with E-Archive specific structure
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
         xmlns:ccts="urn:un:unece:uncefact:documentation:2"
         xmlns:qdt="urn:oasis:names:specification:ubl:schema:xsd:QualifiedDatatypes-2"
         xmlns:udt="urn:un:unece:uncefact:data:specification:UnqualifiedDataTypesSchemaModule:2"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
  <cbc:CustomizationID>TR1.2</cbc:CustomizationID>
  <cbc:ProfileID>EARSIVFATURA</cbc:ProfileID>
  <cbc:ID>${escapeXml(invoiceNumber)}</cbc:ID>
  <cbc:CopyIndicator>false</cbc:CopyIndicator>
  <cbc:UUID>${invoiceETTN}</cbc:UUID>
  <cbc:IssueDate>${issueDate}</cbc:IssueDate>
  <cbc:IssueTime>${issueTime}</cbc:IssueTime>
  <cbc:InvoiceTypeCode>${escapeXml(invoiceType)}</cbc:InvoiceTypeCode>`;
  
  // Add Note if exists (yazıyla tutar)
  if (invoice.notlar) {
    xml += `
  <cbc:Note>${escapeXml(invoice.notlar)}</cbc:Note>`;
  }
  
  xml += `
  <cbc:DocumentCurrencyCode listAgencyName="United Nations Economic Commission for Europe" listID="ISO 4217 Alpha" listName="Currency" listVersionID="2001">${currency}</cbc:DocumentCurrencyCode>
  <cbc:LineCountNumeric>${items.length}</cbc:LineCountNumeric>`;
  
  // E-Arşiv özel: VERİBAN mali mühür Signature elementi
  // ÖNEMLİ: schemeID="VKN_TCKN" olmalı (Veriban kuralı)
  xml += `
  <cac:Signature>
    <cbc:ID schemeID="VKN_TCKN">${VERIBAN_VKN}</cbc:ID>
    <cac:SignatoryParty>
      <cac:PartyIdentification>
        <cbc:ID schemeID="VKN">${VERIBAN_VKN}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PostalAddress>
        <cbc:CityName>${VERIBAN_CITY}</cbc:CityName>
        <cac:Country>
          <cbc:Name>${VERIBAN_COUNTRY}</cbc:Name>
        </cac:Country>
      </cac:PostalAddress>
    </cac:SignatoryParty>
    <cac:DigitalSignatureAttachment>
      <cac:ExternalReference>
        <cbc:URI>#Signature</cbc:URI>
      </cac:ExternalReference>
    </cac:DigitalSignatureAttachment>
  </cac:Signature>`;
  
  // E-Arşiv özel: AdditionalDocumentReference (İrsaliye yerine geçer notu)
  xml += `
  <cac:AdditionalDocumentReference>
    <cbc:ID schemeID="XSLTDISPATCH">İrsaliye yerine geçer.</cbc:ID>
    <cbc:IssueDate>${issueDate}</cbc:IssueDate>
  </cac:AdditionalDocumentReference>`;
  
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
  
  // AccountingCustomerParty (Alıcı) - E-Arşiv özel yapı
  xml += `
  <cac:AccountingCustomerParty>
    <cac:Party>`;

  // PartyIdentification: VKN or TCKN
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

  // E-Arşiv özel: TCKN için Person elementi ZORUNLU
  if (isTCKN) {
    const nameParts = customerName.split(' ');
    const firstName = nameParts.slice(0, -1).join(' ') || customerName;
    const familyName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';

    xml += `
      <cac:Person>
        <cbc:FirstName>${firstName}</cbc:FirstName>
        <cbc:FamilyName>${familyName}</cbc:FamilyName>
      </cac:Person>`;
  }

  // E-Arşiv için PartyTaxScheme EKLENMEMELİ (önemli fark!)
  // Sadece iletişim bilgileri eklenir
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
  
  // TaxTotal
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
    xml += `
    <cbc:AllowanceTotalAmount currencyID="${currency}">${allowanceTotalAmount.toFixed(2)}</cbc:AllowanceTotalAmount>`;
  }
  
  xml += `
    <cbc:TaxExclusiveAmount currencyID="${currency}">${taxExclusiveAmount.toFixed(2)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="${currency}">${taxInclusiveAmount.toFixed(2)}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="${currency}">${payableAmount.toFixed(2)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>`;
  
  // Invoice Lines
  items.forEach((item, index) => {
    const lineNumber = index + 1;
    const quantity = item.miktar || 0;
    const unitPrice = item.birim_fiyat || 0;
    const vatRate = item.kdv_orani || 0;
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
      xml += `
      <cac:SellersItemIdentification>
        <cbc:ID>${escapeXml(item.gtip_kodu)}</cbc:ID>
      </cac:SellersItemIdentification>`;
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
        <cbc:Percent>${vatRate.toFixed(2)}</cbc:Percent>
        <cac:TaxCategory>
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
  
  xml += `
</Invoice>`;
  
  return xml;
}

