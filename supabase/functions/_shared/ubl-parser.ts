/**
 * UBL-TR XML Parser Utility
 * 
 * This module provides utilities for parsing UBL-TR XML invoice format
 * and extracting invoice data including supplier info, line items, etc.
 */

import { XMLParser } from 'https://esm.sh/fast-xml-parser@4';

export interface ParsedInvoiceItem {
  id: string;
  description: string;
  productCode: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  vatRate: number;
  vatAmount: number;
  totalAmount: number;
  discountRate: number;
  discountAmount: number;
  lineNumber: number | string;
  gtipCode?: string;
}

export interface ParsedSupplierInfo {
  name: string;
  taxNumber: string;
  taxOffice?: string;
  address?: {
    street?: string;
    city?: string;
    postalCode?: string;
    country?: string;
  };
  contact?: {
    email?: string;
    phone?: string;
  };
}

export interface ParsedCustomerInfo {
  name: string;
  taxNumber: string;
  taxOffice?: string;
  address?: {
    street?: string;
    city?: string;
    postalCode?: string;
    country?: string;
  };
  contact?: {
    email?: string;
    phone?: string;
  };
}

export interface ParsedInvoice {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string;
  currency: string;
  taxExclusiveAmount: number;
  taxTotalAmount: number;
  payableAmount: number;
  invoiceType?: string;
  invoiceProfile?: string;
  supplierInfo: ParsedSupplierInfo;
  customerInfo?: ParsedCustomerInfo;
  items: ParsedInvoiceItem[];
  ettn?: string;
  uuid?: string;
}

/**
 * Map UBL-TR unit codes to human-readable unit names
 */
export function mapUBLTRToUnit(ubltrCode: string): string {
  if (!ubltrCode) return 'Adet';
  
  const codeUpper = ubltrCode.toUpperCase();
  const ubltrToUnitMap: Record<string, string> = {
    'C62': 'Adet',
    'MTR': 'Metre',
    'KGM': 'Kilogram',
    'LTR': 'Litre',
    'MTK': 'Metrekare',
    'MTQ': 'Metreküp',
    'GRM': 'Gram',
    'TNE': 'Ton',
    'SET': 'Takım',
    'PK': 'Paket',
    'CT': 'Kutu',
    'BG': 'Torba',
    'BX': 'Kasa',
    'EA': 'Adet',
    'PC': 'Parça',
    'PR': 'Çift',
    'PA': 'Palet',
    'TU': 'Tüp',
    'BO': 'Şişe',
    'CN': 'Kutu',
    'DZN': 'Düzine',
    'GRO': 'Gros',
    'HUR': 'Saat',
    'DAY': 'Gün',
    'MON': 'Ay',
    'ANN': 'Yıl',
  };

  if (ubltrToUnitMap[codeUpper]) return ubltrToUnitMap[codeUpper];
  
  // Default fallback
  return 'Adet';
}

/**
 * Parse UBL-TR XML invoice from string
 */
export function parseUBLTRXML(xmlContent: string): ParsedInvoice | null {
  try {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@',
      textNodeName: '#text',
      parseAttributeValue: true,
      trimValues: true,
    });

    const xmlObj = parser.parse(xmlContent);
    
    // Navigate through the XML structure
    const invoice = xmlObj?.Invoice || xmlObj?.['cac:Invoice'] || xmlObj;
    
    if (!invoice) {
      console.error('❌ Invoice element not found in XML');
      return null;
    }

    // Extract basic invoice information
    const invoiceNumber = invoice?.['cbc:ID']?.['#text'] || 
                          invoice?.['cbc:ID'] || 
                          invoice?.['ID'] || 
                          '';
    
    const invoiceDate = invoice?.['cbc:IssueDate']?.['#text'] || 
                       invoice?.['cbc:IssueDate'] || 
                       invoice?.['IssueDate'] || 
                       new Date().toISOString();
    
    const dueDate = invoice?.['cbc:DueDate']?.['#text'] || 
                   invoice?.['cbc:DueDate'] || 
                   invoice?.['DueDate'] || 
                   null;
    
    const currency = invoice?.['cbc:DocumentCurrencyCode']?.['#text'] || 
                    invoice?.['cbc:DocumentCurrencyCode'] || 
                    invoice?.['DocumentCurrencyCode'] || 
                    'TRY';
    
    // Extract amounts
    const taxExclusiveAmount = parseFloat(
      invoice?.['cac:LegalMonetaryTotal']?.['cbc:TaxExclusiveAmount']?.['#text'] || 
      invoice?.['cac:LegalMonetaryTotal']?.['cbc:TaxExclusiveAmount'] || 
      invoice?.['LegalMonetaryTotal']?.['TaxExclusiveAmount'] || 
      '0'
    );
    
    const taxTotalAmount = parseFloat(
      invoice?.['cac:TaxTotal']?.['cbc:TaxAmount']?.['#text'] || 
      invoice?.['cac:TaxTotal']?.['cbc:TaxAmount'] || 
      invoice?.['TaxTotal']?.['TaxAmount'] || 
      '0'
    );
    
    const payableAmount = parseFloat(
      invoice?.['cac:LegalMonetaryTotal']?.['cbc:PayableAmount']?.['#text'] || 
      invoice?.['cac:LegalMonetaryTotal']?.['cbc:PayableAmount'] || 
      invoice?.['LegalMonetaryTotal']?.['PayableAmount'] || 
      '0'
    );

    // Extract ETTN/UUID
    const ettn = invoice?.['cbc:UUID']?.['#text'] || 
                 invoice?.['cbc:UUID'] || 
                 invoice?.['UUID'] || 
                 '';

    // Extract invoice type and profile
    const invoiceType = invoice?.['cbc:InvoiceTypeCode']?.['#text'] || 
                       invoice?.['cbc:InvoiceTypeCode'] || 
                       invoice?.['InvoiceTypeCode'] || 
                       'SATIS';
    
    const invoiceProfile = invoice?.['cbc:ProfileID']?.['#text'] || 
                          invoice?.['cbc:ProfileID'] || 
                          invoice?.['ProfileID'] || 
                          'TEMELFATURA';

    // Extract supplier information
    const accountingSupplierParty = invoice?.['cac:AccountingSupplierParty'] || 
                                   invoice?.['AccountingSupplierParty'] || 
                                   {};
    
    const supplierParty = accountingSupplierParty?.['cac:Party'] || 
                         accountingSupplierParty?.['Party'] || 
                         accountingSupplierParty || 
                         {};
    
    const partyName = supplierParty?.['cac:PartyName'] || 
                     supplierParty?.['PartyName'] || 
                     {};
    
    const supplierName = partyName?.['cbc:Name']?.['#text'] || 
                        partyName?.['cbc:Name'] || 
                        partyName?.['Name'] || 
                        '';
    
    const partyTaxScheme = supplierParty?.['cac:PartyTaxScheme'] || 
                          supplierParty?.['PartyTaxScheme'] || 
                          {};
    
    // PartyTaxScheme can be array or single object
    const taxSchemeArray = Array.isArray(partyTaxScheme) ? partyTaxScheme : [partyTaxScheme];
    let supplierTaxNumber = '';
    
    for (const taxSchemeItem of taxSchemeArray) {
      const companyId = taxSchemeItem?.['cac:CompanyID']?.['#text'] || 
                       taxSchemeItem?.['cac:CompanyID'] || 
                       taxSchemeItem?.['CompanyID'] || 
                       taxSchemeItem?.['cbc:CompanyID']?.['#text'] || 
                       taxSchemeItem?.['cbc:CompanyID'] || 
                       '';
      
      if (companyId) {
        supplierTaxNumber = companyId;
        break;
      }
    }
    
    const postalAddress = supplierParty?.['cac:PostalAddress'] || 
                         supplierParty?.['PostalAddress'] || 
                         {};
    
    const contact = supplierParty?.['cac:Contact'] || 
                   supplierParty?.['Contact'] || 
                   {};
    
    const supplierInfo: ParsedSupplierInfo = {
      name: supplierName,
      taxNumber: supplierTaxNumber,
      taxOffice: partyTaxScheme?.['TaxScheme']?.['Name'] || '',
      address: {
        street: postalAddress?.['cbc:StreetName']?.['#text'] || postalAddress?.['cbc:StreetName'] || '',
        city: postalAddress?.['cbc:CityName']?.['#text'] || postalAddress?.['cbc:CityName'] || '',
        postalCode: postalAddress?.['cbc:PostalZone']?.['#text'] || postalAddress?.['cbc:PostalZone'] || '',
        country: postalAddress?.['cac:Country']?.['cbc:Name']?.['#text'] || postalAddress?.['cac:Country']?.['cbc:Name'] || '',
      },
      contact: {
        email: contact?.['cbc:ElectronicMail']?.['#text'] || contact?.['cbc:ElectronicMail'] || '',
        phone: contact?.['cbc:Telephone']?.['#text'] || contact?.['cbc:Telephone'] || '',
      },
    };

    // Extract customer information (AccountingCustomerParty)
    const accountingCustomerParty = invoice?.['cac:AccountingCustomerParty'] || 
                                   invoice?.['AccountingCustomerParty'] || 
                                   {};
    
    const customerParty = accountingCustomerParty?.['cac:Party'] || 
                         accountingCustomerParty?.['Party'] || 
                         accountingCustomerParty || 
                         {};
    
    const customerPartyName = customerParty?.['cac:PartyName'] || 
                             customerParty?.['PartyName'] || 
                             {};
    
    const customerName = customerPartyName?.['cbc:Name']?.['#text'] || 
                        customerPartyName?.['cbc:Name'] || 
                        customerPartyName?.['Name'] || 
                        '';
    
    const customerTaxScheme = customerParty?.['cac:PartyTaxScheme'] || 
                             customerParty?.['PartyTaxScheme'] || 
                             {};
    
    // PartyTaxScheme can be array or single object
    const customerTaxSchemeArray = Array.isArray(customerTaxScheme) ? customerTaxScheme : [customerTaxScheme];
    let customerTaxNumber = '';
    
    for (const taxSchemeItem of customerTaxSchemeArray) {
      const companyId = taxSchemeItem?.['cac:CompanyID']?.['#text'] || 
                       taxSchemeItem?.['cac:CompanyID'] || 
                       taxSchemeItem?.['CompanyID'] || 
                       taxSchemeItem?.['cbc:CompanyID']?.['#text'] || 
                       taxSchemeItem?.['cbc:CompanyID'] || 
                       '';
      
      if (companyId) {
        customerTaxNumber = companyId;
        break;
      }
    }
    
    const customerPostalAddress = customerParty?.['cac:PostalAddress'] || 
                                 customerParty?.['PostalAddress'] || 
                                 {};
    
    const customerContact = customerParty?.['cac:Contact'] || 
                           customerParty?.['Contact'] || 
                           {};
    
    const customerInfo: ParsedCustomerInfo = {
      name: customerName,
      taxNumber: customerTaxNumber,
      taxOffice: customerTaxScheme?.['TaxScheme']?.['Name'] || '',
      address: {
        street: customerPostalAddress?.['cbc:StreetName']?.['#text'] || customerPostalAddress?.['cbc:StreetName'] || '',
        city: customerPostalAddress?.['cbc:CityName']?.['#text'] || customerPostalAddress?.['cbc:CityName'] || '',
        postalCode: customerPostalAddress?.['cbc:PostalZone']?.['#text'] || customerPostalAddress?.['cbc:PostalZone'] || '',
        country: customerPostalAddress?.['cac:Country']?.['cbc:Name']?.['#text'] || customerPostalAddress?.['cac:Country']?.['cbc:Name'] || '',
      },
      contact: {
        email: customerContact?.['cbc:ElectronicMail']?.['#text'] || customerContact?.['cbc:ElectronicMail'] || '',
        phone: customerContact?.['cbc:Telephone']?.['#text'] || customerContact?.['cbc:Telephone'] || '',
      },
    };

    // Extract invoice lines
    const invoiceLines = invoice?.['cac:InvoiceLine'] || [];
    const linesArray = Array.isArray(invoiceLines) ? invoiceLines : [invoiceLines];
    
    const items: ParsedInvoiceItem[] = linesArray
      .filter((line: any) => line && Object.keys(line).length > 0)
      .map((line: any, index: number) => {
        const item = line?.['cac:Item'] || {};
        const price = line?.['cac:Price'] || {};
        const taxTotal = line?.['cac:TaxTotal'] || {};
        const taxSubtotal = taxTotal?.['cac:TaxSubtotal'] || {};
        const quantity = line?.['cbc:InvoicedQuantity'] || {};
        
        // Extract unit code and convert to readable unit
        const rawUnit = quantity?.['@unitCode'] || quantity?.['unitCode'] || 'C62';
        const unit = mapUBLTRToUnit(rawUnit);
        
        // Extract tax rate - can be in TaxSubtotal array or single object
        let vatRate = 18; // default
        const taxSubtotalArray = Array.isArray(taxSubtotal) ? taxSubtotal : [taxSubtotal];
        if (taxSubtotalArray.length > 0) {
          const firstTax = taxSubtotalArray[0];
          vatRate = parseFloat(
            firstTax?.['cac:TaxCategory']?.['cbc:Percent']?.['#text'] || 
            firstTax?.['cac:TaxCategory']?.['cbc:Percent'] || 
            firstTax?.['TaxCategory']?.['Percent'] || 
            '18'
          );
        }
        
        const quantityValue = parseFloat(
          quantity?.['#text'] || 
          quantity?.['text'] || 
          quantity || 
          '1'
        );
        
        const unitPrice = parseFloat(
          price?.['cbc:PriceAmount']?.['#text'] || 
          price?.['cbc:PriceAmount'] || 
          price?.['PriceAmount'] || 
          '0'
        );
        
        const vatAmount = parseFloat(
          taxTotal?.['cbc:TaxAmount']?.['#text'] || 
          taxTotal?.['cbc:TaxAmount'] || 
          taxTotal?.['TaxAmount'] || 
          '0'
        );
        
        const lineTotal = parseFloat(
          line?.['cbc:LineExtensionAmount']?.['#text'] || 
          line?.['cbc:LineExtensionAmount'] || 
          line?.['LineExtensionAmount'] || 
          '0'
        );
        
        // Extract product code
        const productCode = line?.['cbc:ID']?.['#text'] || 
                           line?.['cbc:ID'] || 
                           item?.['cac:SellersItemIdentification']?.['cbc:ID']?.['#text'] || 
                           item?.['cac:SellersItemIdentification']?.['cbc:ID'] || 
                           item?.['SellersItemIdentification']?.['ID'] || 
                           '';
        
        // Extract description
        const description = item?.['cbc:Name']?.['#text'] || 
                          item?.['cbc:Name'] || 
                          item?.['cbc:Description']?.['#text'] || 
                          item?.['cbc:Description'] || 
                          item?.['Name'] || 
                          item?.['Description'] || 
                          `Ürün ${index + 1}`;
        
        // Extract GTIP code if available
        const gtipCode = item?.['cac:CommodityClassification']?.['cbc:ItemClassificationCode']?.['#text'] || 
                        item?.['cac:CommodityClassification']?.['cbc:ItemClassificationCode'] || 
                        '';
        
        return {
          id: `line-${index}`,
          description,
          productCode,
          quantity: quantityValue,
          unit,
          unitPrice,
          vatRate,
          vatAmount,
          totalAmount: lineTotal,
          discountRate: 0, // UBL-TR doesn't always have discount info
          discountAmount: 0,
          lineNumber: line?.['cbc:ID']?.['#text'] || line?.['cbc:ID'] || index + 1,
          gtipCode,
        };
      });

    return {
      invoiceNumber,
      invoiceDate,
      dueDate: dueDate || undefined,
      currency,
      taxExclusiveAmount,
      taxTotalAmount,
      payableAmount,
      invoiceType,
      invoiceProfile,
      supplierInfo,
      customerInfo,
      items,
      ettn,
      uuid: ettn,
    };
  } catch (error) {
    console.error('❌ Error parsing UBL-TR XML:', error);
    return null;
  }
}

/**
 * Decode base64 ZIP and extract XML content
 * Uses jszip for Deno (via esm.sh)
 */
export async function decodeZIPAndExtractXML(base64Data: string): Promise<string | null> {
  try {
    // Validate base64 string
    if (!base64Data || typeof base64Data !== 'string') {
      console.error('❌ Invalid base64 data: not a string');
      return null;
    }

    // Clean base64 string (remove whitespace, newlines, etc.)
    const cleanBase64 = base64Data.trim().replace(/\s/g, '');
    
    if (cleanBase64.length === 0) {
      console.error('❌ Invalid base64 data: empty string');
      return null;
    }

    // Decode base64 to binary
    let binaryString: string;
    try {
      binaryString = atob(cleanBase64);
    } catch (atobError: any) {
      console.error('❌ Base64 decode hatası:', atobError.message);
      console.error('❌ Base64 data length:', cleanBase64.length);
      console.error('❌ Base64 data preview:', cleanBase64.substring(0, 100));
      return null;
    }

    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Use JSZip for ZIP extraction in Deno
    // JSZip works in Deno via esm.sh
    const JSZip = await import('https://esm.sh/jszip@3.10.1');
    const zip = new JSZip.default();
    
    // Load ZIP from bytes
    await zip.loadAsync(bytes);
    
    // Find and extract first XML file
    for (const fileName in zip.files) {
      if (fileName.endsWith('.xml') || fileName.endsWith('.XML')) {
        const file = zip.files[fileName];
        if (!file.dir) {
          const content = await file.async('string');
          console.log(`✅ XML dosyası bulundu: ${fileName}`);
          return content;
        }
      }
    }
    
    console.warn('⚠️ ZIP içinde XML dosyası bulunamadı');
    return null;
  } catch (error: any) {
    console.error('❌ ZIP decode/extract hatası:', error);
    console.error('❌ Error details:', {
      message: error?.message,
      name: error?.name,
      stack: error?.stack?.substring(0, 200)
    });
    
    // Fallback: try to parse as direct XML if it's not actually a ZIP
    try {
      const text = atob(base64Data);
      if (text.trim().startsWith('<?xml') || text.trim().startsWith('<')) {
        console.log('✅ Base64 direkt XML içeriyor');
        return text;
      }
    } catch (fallbackError) {
      console.error('❌ Fallback XML parse hatası:', fallbackError);
      // Not XML either
    }
    
    return null;
  }
}
