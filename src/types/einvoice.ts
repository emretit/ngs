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

export interface OutgoingInvoiceItem {
  id: string;
  outgoing_invoice_id: string;
  company_id: string;
  line_number: number;
  product_code?: string;
  product_name: string;
  description?: string;
  quantity: number;
  unit: string;
  unit_code?: string;
  unit_price: number;
  gross_amount: number;
  discount_rate: number;
  discount_amount: number;
  tax_rate: number;
  tax_amount: number;
  line_total: number;
  line_total_with_tax: number;
  gtip_code?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface OutgoingInvoiceDetails {
  id: string;
  ettn: string;
  invoice_number: string;
  invoice_date: string;
  invoice_time?: string;
  due_date?: string;
  
  // Customer Information
  customer_name: string;
  customer_tax_number?: string;
  customer_tax_office?: string;
  customer_alias?: string;
  customer_address_street?: string;
  customer_address_city?: string;
  customer_address_district?: string;
  customer_address_postal_zone?: string;
  customer_address_country?: string;
  customer_contact_name?: string;
  customer_contact_telephone?: string;
  customer_contact_email?: string;
  
  // Supplier Information
  supplier_name?: string;
  supplier_tax_number?: string;
  supplier_tax_office?: string;
  supplier_address_street?: string;
  supplier_address_city?: string;
  supplier_address_district?: string;
  supplier_contact_telephone?: string;
  supplier_contact_email?: string;
  
  // Financial Information
  tax_exclusive_amount: number;
  tax_total_amount: number;
  payable_amount: number;
  line_extension_amount?: number;
  total_discount_amount?: number;
  currency: string;
  
  // Payment Information
  payment_means_code?: string;
  payment_channel_code?: string;
  payee_iban?: string;
  payee_bank_name?: string;
  payment_terms_note?: string;
  
  // Invoice Metadata
  invoice_type?: string;
  invoice_profile?: string;
  invoice_note?: string;
  scenario?: string;
  document_type?: string;
  status: string;
  
  // E-Logo Integration
  elogo_status?: number;
  elogo_code?: number;
  elogo_description?: string;
  
  // Answer Information
  is_answered?: boolean;
  answer_type?: string;
  answer_description?: string;
  answer_date?: string;
  
  // Timestamps
  sent_at?: string;
  delivered_at?: string;
  created_at?: string;
  updated_at?: string;
  
  // Additional
  notes?: string;
  xml_content?: string;
}

export interface EInvoiceDetails {
  id: string;
  invoice_number: string;
  supplier_name: string;
  supplier_tax_number: string;
  invoice_date: string;
  due_date?: string;
  currency: string;
  subtotal: number;
  tax_total: number;
  total_amount: number;
  items: EInvoiceItem[];
}

export interface ProductMatchingItem {
  invoice_item: EInvoiceItem;
  matched_product_id?: string;
  match_type: 'automatic' | 'manual' | 'new_product' | 'unmatched';
  confidence_score?: number;
  notes?: string;
}

export interface ProductMatchingStep {
  step: 1 | 2 | 3 | 4 | 5;
  title: string;
  description: string;
  completed: boolean;
}

export interface MatchingSummary {
  total_items: number;
  matched_items: number;
  new_products: number;
  unmatched_items: number;
  confidence_avg: number;
}