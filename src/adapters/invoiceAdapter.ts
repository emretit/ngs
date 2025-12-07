import { IncomingInvoice } from '@/hooks/useIncomingInvoices';

/**
 * Invoice Adapter
 * Converts invoices from different integrators (Nilvera, e-Logo) to a unified format
 */
export class InvoiceAdapter {
  /**
   * Convert Nilvera invoice to unified IncomingInvoice format
   */
  static fromNilvera(nilveraInvoice: any): IncomingInvoice {
    return {
      id: nilveraInvoice.id || '',
      invoiceNumber: nilveraInvoice.invoiceNumber || '',
      supplierName: nilveraInvoice.supplierName || '',
      supplierTaxNumber: nilveraInvoice.supplierTaxNumber || '',
      invoiceDate: nilveraInvoice.invoiceDate || new Date().toISOString(),
      dueDate: nilveraInvoice.dueDate,
      totalAmount: nilveraInvoice.totalAmount || 0,
      paidAmount: nilveraInvoice.paidAmount || 0,
      currency: nilveraInvoice.currency || 'TRY',
      taxAmount: nilveraInvoice.taxAmount || 0,
      status: nilveraInvoice.status || 'pending',
      responseStatus: nilveraInvoice.responseStatus,
      isAnswered: nilveraInvoice.isAnswered || false,
      pdfUrl: nilveraInvoice.pdfUrl,
      xmlData: nilveraInvoice.xmlData || {},
      invoiceType: nilveraInvoice.invoiceType,
      invoiceProfile: nilveraInvoice.invoiceProfile,
    };
  }

  /**
   * Convert e-Logo invoice to unified IncomingInvoice format
   * e-Logo returns documents in SOAP format with binary/base64 data
   */
  static fromElogo(elogoInvoice: any): IncomingInvoice {
    // Extract data from e-Logo's SOAP response structure
    const xmlData = elogoInvoice.xmlData || elogoInvoice;
    
    // e-Logo specific fields mapping
    // Note: In production, you'd decode the binaryData ZIP, parse UBL-TR XML
    // and extract these values properly
    
    return {
      id: elogoInvoice.id || elogoInvoice.documentUuid || '',
      invoiceNumber: elogoInvoice.invoiceNumber || this.extractInvoiceNumber(xmlData),
      supplierName: elogoInvoice.supplierName || this.extractSupplierName(xmlData),
      supplierTaxNumber: elogoInvoice.supplierTaxNumber || this.extractTaxNumber(xmlData),
      invoiceDate: elogoInvoice.invoiceDate || new Date().toISOString(),
      dueDate: elogoInvoice.dueDate,
      totalAmount: elogoInvoice.totalAmount || 0,
      paidAmount: elogoInvoice.paidAmount || 0,
      currency: elogoInvoice.currency || 'TRY',
      taxAmount: elogoInvoice.taxAmount || 0,
      status: elogoInvoice.status || 'pending',
      responseStatus: elogoInvoice.responseStatus,
      isAnswered: elogoInvoice.isAnswered || false,
      pdfUrl: elogoInvoice.pdfUrl,
      xmlData: xmlData,
      invoiceType: elogoInvoice.invoiceType || 'SATIS',
      invoiceProfile: elogoInvoice.invoiceProfile || 'TEMELFATURA',
    };
  }

  /**
   * Convert array of Nilvera invoices
   */
  static fromNilveraArray(invoices: any[]): IncomingInvoice[] {
    return invoices.map(inv => this.fromNilvera(inv));
  }

  /**
   * Convert array of e-Logo invoices
   */
  static fromElogoArray(invoices: any[]): IncomingInvoice[] {
    return invoices.map(inv => this.fromElogo(inv));
  }

  /**
   * Auto-detect integrator and convert
   */
  static fromAny(invoice: any, integrator?: 'nilvera' | 'elogo'): IncomingInvoice {
    // If integrator is specified, use it
    if (integrator === 'nilvera') {
      return this.fromNilvera(invoice);
    }
    if (integrator === 'elogo') {
      return this.fromElogo(invoice);
    }

    // Auto-detect based on structure
    if (invoice.documentUuid || invoice.envelopeId || invoice.binaryData) {
      // Likely e-Logo format
      return this.fromElogo(invoice);
    }

    // Default to Nilvera format
    return this.fromNilvera(invoice);
  }

  /**
   * Helper: Extract invoice number from UBL XML data
   * In production, this would parse the actual XML/UBL structure
   */
  private static extractInvoiceNumber(xmlData: any): string {
    if (typeof xmlData === 'object' && xmlData.fileName) {
      // Extract from filename if available
      return xmlData.fileName.replace('.zip', '').replace(/[^a-zA-Z0-9-]/g, '');
    }
    return 'UNKNOWN';
  }

  /**
   * Helper: Extract supplier name from UBL XML data
   */
  private static extractSupplierName(xmlData: any): string {
    // In production, parse UBL XML and extract cac:AccountingSupplierParty/cac:Party/cac:PartyName/cbc:Name
    return 'e-Logo Tedarikçi';
  }

  /**
   * Helper: Extract tax number from UBL XML data
   */
  private static extractTaxNumber(xmlData: any): string {
    // In production, parse UBL XML and extract cac:AccountingSupplierParty/cac:Party/cac:PartyTaxScheme/cbc:TaxID
    return '';
  }

  /**
   * Parse e-Logo binary data (base64 encoded ZIP)
   * Returns parsed UBL structure
   * Note: This is a placeholder - actual implementation would need to:
   * 1. Decode base64
   * 2. Unzip the file
   * 3. Parse UBL-TR XML
   */
  static async parseElogoBinaryData(binaryData: string): Promise<any> {
    // TODO: Implement actual parsing
    // This would require a library like JSZip and XML parser
    console.warn('parseElogoBinaryData not fully implemented - would need JSZip and XML parser');
    return {
      parsed: false,
      raw: binaryData,
    };
  }

  /**
   * Convert mükellef response from Nilvera format
   */
  static mukellefeFromNilvera(data: any) {
    return {
      aliasName: data?.aliasName || '',
      companyName: data?.companyName || '',
      taxNumber: data?.taxNumber || '',
      taxOffice: data?.taxOffice || '',
      address: data?.address || '',
      city: data?.city || '',
      district: data?.district || '',
      isEinvoiceMukellef: true,
    };
  }

  /**
   * Convert mükellef response from e-Logo format
   */
  static mukellefeFromElogo(data: any) {
    return {
      aliasName: data?.aliasName || data?.invoicePkAlias || '',
      companyName: data?.companyName || data?.title || '',
      taxNumber: data?.taxNumber || data?.identifier || '',
      taxOffice: data?.taxOffice || '',
      address: data?.address || '',
      city: data?.city || '',
      district: data?.district || '',
      isEinvoiceMukellef: true,
    };
  }
}
