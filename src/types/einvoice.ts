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