export interface EInvoiceItem {
  id: string;
  line_number: number;
  product_name: string;
  product_code?: string;
  quantity: number;
  unit: string;
  unit_price: number;
  tax_rate: number;
  discount_rate?: number;
  line_total: number;
  tax_amount?: number;
  gtip_code?: string;
  description?: string;
}

export interface EInvoiceDetails {
  id: string;
  invoice_number: string;
  supplier_name: string;
  supplier_tax_number: string;
  invoice_date: string;
  due_date?: string;
  currency: string;
  exchange_rate?: number;
  subtotal: number;
  tax_total: number;
  total_amount: number;
  // TL karşılıkları (dövizli faturalar için)
  subtotal_try?: number;
  tax_total_try?: number;
  total_amount_try?: number;
  items: EInvoiceItem[];
  // Detaylı tedarikçi bilgileri
  supplier_details?: {
    company_name?: string;
    tax_number?: string;
    trade_registry_number?: string;
    mersis_number?: string;
    email?: string;
    phone?: string;
    website?: string;
    fax?: string;
    address?: {
      street?: string;
      district?: string;
      city?: string;
      postal_code?: string;
      country?: string;
    };
    bank_info?: {
      bank_name?: string;
      iban?: string;
      account_number?: string;
    };
  };
  // Veriban durum bilgileri - giden faturalar için
  status?: string;
  elogo_status?: number | null;        // StateCode (1-5)
  elogo_code?: number | null;          // AnswerStateCode
  elogo_description?: string | null;   // Durum açıklaması
  answer_type?: string | null;         // KABUL/RED/IADE
  is_answered?: boolean;               // Cevap verildi mi?
}

export interface ProductMatchingItem {
  invoice_item: EInvoiceItem;
  matched_product_id?: string;
  notes?: string;
}

export interface Supplier {
  id: string;
  name: string;
  tax_number?: string;
  email?: string;
  company_id?: string;
}

