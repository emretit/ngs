/**
 * E-Arşiv Fatura UBL 2.1 TypeScript Type Definitions
 * 
 * Bu dosya, INVOICE_YALI_ATAKOY_APART_UNITE_VE_ISYERI_TOPLU_YAPI_YONETIMI_NGA2026000000008.xml
 * dosyasının detaylı analizinden oluşturulmuştur.
 * 
 * @standard UBL 2.1 (OASIS Universal Business Language)
 * @profile EARSIVFATURA
 * @created 2026-01-13
 */

/**
 * Dijital imza bilgileri
 * UBLExtensions > ExtensionContent > Signature
 */
export interface DigitalSignature {
  /** İmza ID (örn: Sign-Id-NGA2026000000008) */
  signature_id: string;
  
  /** İmza algoritması (örn: ECDSA-SHA384) */
  algorithm: string;
  
  /** İmza zamanı (ISO 8601 formatında) */
  signing_time: string;
  
  /** İmza değeri (Base64 encoded) */
  signature_value?: string;
  
  /** Sertifika bilgileri */
  certificate: {
    /** Sertifika sahibi (CN, SERIALNUMBER) */
    owner: string;
    
    /** Sertifika seri numarası */
    serial_number?: string;
    
    /** Sertifika veren kurum */
    issuer: string;
    
    /** X.509 sertifika verisi (Base64 encoded) */
    x509_certificate?: string;
  };
  
  /** Digest (özet) bilgileri */
  digest?: {
    algorithm: string;
    value: string;
  }[];
}

/**
 * Fatura başlık bilgileri
 */
export interface InvoiceHeader {
  /** Fatura numarası (örn: NGA2026000000008) */
  invoice_number: string;
  
  /** Evrensel benzersiz tanımlayıcı */
  uuid: string;
  
  /** Fatura tarihi (YYYY-MM-DD) */
  issue_date: string;
  
  /** Fatura saati (HH:mm:ss) */
  issue_time: string;
  
  /** Fatura tipi (SATIS, IADE, vb.) */
  invoice_type: string;
  
  /** Para birimi kodu (TRY, USD, EUR, vb.) */
  currency: string;
  
  /** Profil ID (EARSIVFATURA, TEMELFATURA, vb.) */
  profile_id?: string;
  
  /** Kopya göstergesi */
  is_copy: boolean;
  
  /** Yazıyla tutar notu */
  note?: string;
}

/**
 * Adres bilgileri
 */
export interface Address {
  /** Cadde/Sokak bilgisi */
  street?: string;
  
  /** Mahalle */
  district?: string;
  
  /** İlçe */
  city_subdivision?: string;
  
  /** İl */
  city?: string;
  
  /** Posta kodu */
  postal_code?: string;
  
  /** Ülke */
  country?: string;
}

/**
 * Taraf (Satıcı veya Alıcı) bilgileri
 */
export interface Party {
  /** Ünvan/Şirket adı */
  name: string;
  
  /** VKN (Vergi Kimlik Numarası) veya TCKN */
  tax_id: string;
  
  /** Ticaret sicil numarası (sadece satıcı için) */
  trade_registry?: string;
  
  /** Vergi dairesi */
  tax_office?: string;
  
  /** Adres bilgileri */
  address: Address;
  
  /** İletişim bilgileri */
  contact?: {
    telephone?: string;
    fax?: string;
    email?: string;
  };
  
  /** Website */
  website?: string;
}

/**
 * Miktar bilgisi
 */
export interface Quantity {
  /** Miktar değeri */
  value: number;
  
  /** Birim kodu (NIU=Adet, MTR=Metre, KGM=Kilogram, vb.) */
  unit: string;
}

/**
 * Fiyat bilgisi
 */
export interface Price {
  /** Tutar */
  amount: number;
  
  /** Para birimi */
  currency: string;
}

/**
 * Vergi detayı
 */
export interface TaxDetail {
  /** Vergi matrahı */
  taxable_amount: number;
  
  /** Vergi tutarı */
  tax_amount: number;
  
  /** Vergi oranı (yüzde olarak) */
  tax_rate: number;
  
  /** Vergi türü (KDV, ÖTV, vb.) */
  tax_type: string;
  
  /** Vergi kodu (0015=%20 KDV, vb.) */
  tax_code?: string;
}

/**
 * Vergi özeti
 */
export interface TaxSummary {
  /** Toplam vergi tutarı */
  total_tax: number;
  
  /** Vergi detayları */
  tax_details: TaxDetail[];
}

/**
 * İskonto/Artırım bilgisi
 */
export interface AllowanceCharge {
  /** true=Artırım, false=İskonto */
  is_charge: boolean;
  
  /** Oran (ondalık olarak, örn: 0.10 = %10) */
  multiplier?: number;
  
  /** Matrah (üzerinden hesaplanan tutar) */
  base_amount?: number;
  
  /** İskonto/Artırım tutarı */
  amount: number;
  
  /** Para birimi */
  currency: string;
  
  /** Açıklama */
  reason?: string;
}

/**
 * Fatura satırı
 */
export interface InvoiceLine {
  /** Satır numarası */
  line_id: string;
  
  /** Miktar bilgisi */
  quantity: Quantity;
  
  /** Satır toplam tutarı (vergiler hariç) */
  line_extension_amount: number;
  
  /** Ürün/Hizmet bilgileri */
  item: {
    /** Ürün adı */
    name: string;
    
    /** Açıklama */
    description?: string;
    
    /** Satıcı ürün kodu */
    seller_code?: string;
    
    /** Alıcı ürün kodu */
    buyer_code?: string;
    
    /** GTIP (Gümrük Tarife İstatistik Pozisyonu) */
    commodity_code?: string;
  };
  
  /** Birim fiyat bilgisi */
  price: Price;
  
  /** Vergi bilgileri */
  tax: {
    /** Toplam vergi */
    total_tax: number;
    
    /** Vergi oranı */
    tax_rate: number;
    
    /** Vergi türü */
    tax_type: string;
  };
  
  /** İskonto/Artırımlar */
  allowance_charges?: AllowanceCharge[];
}

/**
 * Parasal toplamlar
 */
export interface MonetaryTotals {
  /** Mal/Hizmet toplam tutarı (vergiler hariç) */
  line_extension_amount: number;
  
  /** Vergiler hariç toplam tutar (iskontolar düşülmüş) */
  tax_exclusive_amount: number;
  
  /** Vergiler dahil toplam tutar */
  tax_inclusive_amount: number;
  
  /** Toplam iskonto tutarı */
  allowance_total: number;
  
  /** Toplam artırım tutarı */
  charge_total?: number;
  
  /** Ödenecek tutar */
  payable_amount: number;
  
  /** Peşin ödenen tutar */
  paid_amount?: number;
  
  /** Kalan borç */
  payable_rounding_amount?: number;
}

/**
 * Ödeme bilgileri
 */
export interface PaymentTerms {
  /** Ödeme şekli */
  payment_means_code?: string;
  
  /** Ödeme koşulları notu */
  note?: string;
  
  /** Vade tarihi */
  due_date?: string;
  
  /** Banka bilgileri */
  bank_account?: {
    bank_name?: string;
    account_id?: string;
    iban?: string;
  };
}

/**
 * Döküman referansları
 */
export interface DocumentReference {
  /** Referans ID */
  id: string;
  
  /** Referans tarihi */
  issue_date?: string;
  
  /** Döküman tipi */
  document_type?: string;
  
  /** Döküman açıklaması */
  document_description?: string;
}

/**
 * Tam E-Arşiv Fatura yapısı
 */
export interface EArchiveInvoice {
  /** Döküman bilgileri */
  document_info: {
    /** Döküman tipi */
    type: 'E-Arşiv Fatura' | 'E-Fatura';
    
    /** UBL standardı */
    standard: string;
    
    /** Profil */
    profile: string;
    
    /** Oluşturulma zamanı */
    created_at: string;
  };
  
  /** Dijital imza */
  digital_signature: DigitalSignature;
  
  /** Fatura başlığı */
  header: InvoiceHeader;
  
  /** Satıcı bilgileri */
  supplier: Party;
  
  /** Alıcı bilgileri */
  customer: Party;
  
  /** Fatura satırları */
  invoice_lines: InvoiceLine[];
  
  /** Vergi özeti */
  tax_summary: TaxSummary;
  
  /** Parasal toplamlar */
  monetary_totals: MonetaryTotals;
  
  /** Ödeme bilgileri */
  payment_terms?: PaymentTerms;
  
  /** Döküman referansları (sipariş, irsaliye, vb.) */
  document_references?: DocumentReference[];
  
  /** Teslimat bilgileri */
  delivery?: {
    delivery_date?: string;
    delivery_address?: Address;
    carrier_name?: string;
    tracking_id?: string;
  };
  
  /** Ek notlar */
  additional_notes?: string[];
}

/**
 * XML namespace tanımları
 */
export const UBL_NAMESPACES = {
  invoice: 'urn:oasis:names:specification:ubl:schema:xsd:Invoice-2',
  cac: 'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2',
  cbc: 'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2',
  ext: 'urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2',
  ds: 'http://www.w3.org/2000/09/xmldsig#',
  xades: 'http://uri.etsi.org/01903/v1.3.2#',
  ccts: 'urn:un:unece:uncefact:documentation:2',
  qdt: 'urn:oasis:names:specification:ubl:schema:xsd:QualifiedDatatypes-2',
  udt: 'urn:un:unece:uncefact:data:specification:UnqualifiedDataTypesSchemaModule:2',
  ubltr: 'urn:oasis:names:specification:ubl:schema:xsd:TurkishCustomizationExtensionComponents',
} as const;

/**
 * Fatura tipleri
 */
export enum InvoiceType {
  /** Satış faturası */
  SATIS = 'SATIS',
  
  /** İade faturası */
  IADE = 'IADE',
  
  /** Tevkifat faturası */
  TEVKIFAT = 'TEVKIFAT',
  
  /** İstisna faturası */
  ISTISNA = 'ISTISNA',
  
  /** Özel matrah faturası */
  OZELMATRAH = 'OZELMATRAH',
  
  /** İhracat faturası */
  IHRACAT = 'IHRACAT',
}

/**
 * Vergi oranları (Türkiye için)
 */
export enum TaxRate {
  /** %1 KDV */
  KDV_1 = 1,
  
  /** %10 KDV */
  KDV_10 = 10,
  
  /** %20 KDV */
  KDV_20 = 20,
}

/**
 * Vergi kodları
 */
export enum TaxCode {
  /** %1 KDV */
  KDV_1 = '0003',
  
  /** %10 KDV */
  KDV_10 = '0071',
  
  /** %20 KDV */
  KDV_20 = '0015',
  
  /** KDV İstisna */
  KDV_ISTISNA = '0350',
  
  /** ÖTV */
  OTV = '0071',
}

/**
 * Birim kodları (UN/ECE Recommendation 20)
 */
export enum UnitCode {
  /** Adet */
  PIECE = 'NIU',
  
  /** Kilogram */
  KILOGRAM = 'KGM',
  
  /** Metre */
  METRE = 'MTR',
  
  /** Litre */
  LITRE = 'LTR',
  
  /** Metrekare */
  SQUARE_METRE = 'MTK',
  
  /** Metreküp */
  CUBIC_METRE = 'MTQ',
  
  /** Saat */
  HOUR = 'HUR',
  
  /** Gün */
  DAY = 'DAY',
  
  /** Ay */
  MONTH = 'MON',
  
  /** Yıl */
  YEAR = 'ANN',
  
  /** Paket */
  PACKAGE = 'PA',
  
  /** Kutu */
  BOX = 'BX',
  
  /** Koli */
  CARTON = 'CT',
}

/**
 * E-Arşiv profil tipleri
 */
export enum InvoiceProfile {
  /** E-Arşiv Fatura */
  EARSIVFATURA = 'EARSIVFATURA',
  
  /** Temel Fatura */
  TEMELFATURA = 'TEMELFATURA',
  
  /** Ticari Fatura */
  TICARIFATURA = 'TICARIFATURA',
  
  /** İhracat Faturası */
  IHRACATFATURA = 'IHRACATFATURA',
}

/**
 * Helper function: E-Arşiv fatura validasyonu
 */
export function validateEArchiveInvoice(invoice: EArchiveInvoice): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Zorunlu alanlar kontrolü
  if (!invoice.header.invoice_number) {
    errors.push('Fatura numarası zorunludur');
  }
  
  if (!invoice.header.uuid) {
    errors.push('UUID zorunludur');
  }
  
  if (!invoice.supplier.tax_id) {
    errors.push('Satıcı VKN/TCKN zorunludur');
  }
  
  if (!invoice.customer.tax_id) {
    errors.push('Alıcı VKN/TCKN zorunludur');
  }
  
  if (!invoice.invoice_lines || invoice.invoice_lines.length === 0) {
    errors.push('En az bir fatura satırı olmalıdır');
  }
  
  // Matematiksel doğrulama
  const calculatedLineTotal = invoice.invoice_lines.reduce(
    (sum, line) => sum + line.line_extension_amount,
    0
  );
  
  if (Math.abs(calculatedLineTotal - invoice.monetary_totals.line_extension_amount) > 0.01) {
    errors.push('Satır toplamları tutarsız');
  }
  
  const calculatedTaxTotal = invoice.tax_summary.tax_details.reduce(
    (sum, detail) => sum + detail.tax_amount,
    0
  );
  
  if (Math.abs(calculatedTaxTotal - invoice.tax_summary.total_tax) > 0.01) {
    errors.push('Vergi toplamları tutarsız');
  }
  
  const expectedTotal = 
    invoice.monetary_totals.tax_exclusive_amount + 
    invoice.tax_summary.total_tax;
  
  if (Math.abs(expectedTotal - invoice.monetary_totals.payable_amount) > 0.01) {
    errors.push('Ödenecek tutar hesaplaması hatalı');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Helper function: Vergi hesaplama
 */
export function calculateTax(
  amount: number,
  taxRate: number
): {
  taxableAmount: number;
  taxAmount: number;
  totalAmount: number;
} {
  const taxAmount = Math.round(amount * (taxRate / 100) * 100) / 100;
  const totalAmount = Math.round((amount + taxAmount) * 100) / 100;
  
  return {
    taxableAmount: amount,
    taxAmount,
    totalAmount,
  };
}

/**
 * Helper function: Satır tutarı hesaplama
 */
export function calculateLineAmount(
  unitPrice: number,
  quantity: number,
  allowanceCharges?: AllowanceCharge[]
): number {
  let total = unitPrice * quantity;
  
  if (allowanceCharges) {
    for (const ac of allowanceCharges) {
      if (ac.is_charge) {
        total += ac.amount;
      } else {
        total -= ac.amount;
      }
    }
  }
  
  return Math.round(total * 100) / 100;
}
