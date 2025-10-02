// ========================================
// PAFTA.APP - PURCHASING MODULE TYPES
// Full end-to-end purchasing types
// ========================================

// ============= VENDORS =============
export interface Vendor {
  id: string;
  company_id: string;
  name: string;
  type: 'supplier' | 'customer' | 'both';
  tax_number?: string;
  email?: string;
  mobile_phone?: string;
  office_phone?: string;
  address?: string;
  city?: string;
  country?: string;
  payment_terms_days?: number;
  rating?: number;
  incoterm?: string;
  delivery_lead_days?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface VendorContact {
  id: string;
  vendor_id: string;
  company_id: string;
  name: string;
  email?: string;
  phone?: string;
  role?: string;
  is_primary: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// ============= RFQ =============
export type RFQStatus = 'draft' | 'sent' | 'received' | 'closed' | 'cancelled';

export interface RFQ {
  id: string;
  company_id: string;
  rfq_number: string;
  pr_id?: string;
  status: RFQStatus;
  due_date?: string;
  incoterm?: string;
  currency: string;
  notes?: string;
  attachments: any[];
  created_by?: string;
  created_at: string;
  updated_at: string;
  
  // Relations
  purchase_request?: {
    request_number: string;
  };
  vendors?: RFQVendor[];
  lines?: RFQLine[];
  quotes?: RFQQuote[];
}

export interface RFQVendor {
  id: string;
  rfq_id: string;
  vendor_id: string;
  company_id: string;
  status: 'invited' | 'quoted' | 'declined' | 'no_response';
  invited_at: string;
  responded_at?: string;
  
  // Relations
  vendor?: Vendor;
}

export interface RFQLine {
  id: string;
  rfq_id: string;
  company_id: string;
  product_id?: string;
  description: string;
  quantity: number;
  uom: string;
  target_price?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  
  // Relations
  product?: {
    name: string;
    sku: string;
  };
}

export interface RFQQuote {
  id: string;
  rfq_id: string;
  vendor_id: string;
  company_id: string;
  quote_number?: string;
  currency: string;
  exchange_rate: number;
  valid_until?: string;
  delivery_days?: number;
  shipping_cost: number;
  discount_rate: number;
  payment_terms?: string;
  notes?: string;
  attachments: any[];
  subtotal: number;
  tax_total: number;
  grand_total: number;
  is_selected: boolean;
  created_at: string;
  updated_at: string;
  
  // Relations
  vendor?: Vendor;
  lines?: RFQQuoteLine[];
}

export interface RFQQuoteLine {
  id: string;
  rfq_quote_id: string;
  rfq_line_id: string;
  company_id: string;
  unit_price: number;
  tax_rate: number;
  discount_rate: number;
  line_total: number;
  delivery_days?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// ============= GRN (Goods Receipt Note) =============
export type GRNStatus = 'draft' | 'received' | 'putaway' | 'returned' | 'cancelled';
export type QCStatus = 'accepted' | 'rework' | 'rejected';

export interface GRN {
  id: string;
  company_id: string;
  grn_number: string;
  po_id: string;
  status: GRNStatus;
  received_date: string;
  received_by?: string;
  warehouse_id?: string;
  notes?: string;
  attachments: any[];
  created_at: string;
  updated_at: string;
  
  // Relations
  purchase_order?: {
    order_number: string;
    supplier_id: string;
  };
  lines?: GRNLine[];
  receiver?: {
    first_name: string;
    last_name: string;
  };
}

export interface GRNLine {
  id: string;
  grn_id: string;
  po_line_id: string;
  company_id: string;
  received_quantity: number;
  qc_status: QCStatus;
  location_id?: string;
  serials: any[];
  batches: any[];
  notes?: string;
  created_at: string;
  updated_at: string;
  
  // Relations
  po_line?: {
    description: string;
    quantity: number;
    uom: string;
  };
}

// ============= VENDOR INVOICES (AP) =============
export type VendorInvoiceStatus = 'draft' | 'matched' | 'approved' | 'posted' | 'paid' | 'void';
export type MatchStatus = 'unmatched' | 'matched' | 'discrepancy' | 'over_billed';
export type LineMatchStatus = 'matched' | 'qty_mismatch' | 'price_mismatch' | 'unmatched';

export interface VendorInvoice {
  id: string;
  company_id: string;
  invoice_number: string;
  invoice_date: string;
  vendor_id: string;
  po_id?: string;
  grn_id?: string;
  status: VendorInvoiceStatus;
  currency: string;
  exchange_rate: number;
  subtotal: number;
  tax_total: number;
  grand_total: number;
  paid_amount: number;
  due_date?: string;
  payment_terms?: string;
  e_invoice_uuid?: string;
  match_status: MatchStatus;
  notes?: string;
  attachments: any[];
  created_by?: string;
  approved_by?: string;
  approved_at?: string;
  posted_at?: string;
  created_at: string;
  updated_at: string;
  
  // Relations
  vendor?: Vendor;
  purchase_order?: {
    order_number: string;
  };
  grn?: {
    grn_number: string;
  };
  lines?: VendorInvoiceLine[];
}

export interface VendorInvoiceLine {
  id: string;
  vendor_invoice_id: string;
  po_line_id?: string;
  company_id: string;
  product_id?: string;
  description: string;
  quantity: number;
  uom: string;
  unit_price: number;
  tax_rate: number;
  discount_rate: number;
  line_total: number;
  match_status: LineMatchStatus;
  created_at: string;
  updated_at: string;
}

// ============= 3-WAY MATCH =============
export interface ThreeWayMatch {
  po_id: string;
  po_number: string;
  po_line_id: string;
  description: string;
  ordered_qty: number;
  received_qty: number;
  invoiced_qty: number;
  po_unit_price: number;
  invoice_unit_price: number;
  po_line_total: number;
  invoice_line_total: number;
  match_status: 'matched' | 'under_received' | 'over_received' | 'over_invoiced' | 'price_variance' | 'partial';
  company_id: string;
}

// ============= PURCHASING SETTINGS =============
export interface PurchasingSettings {
  id: string;
  company_id: string;
  pr_prefix: string;
  rfq_prefix: string;
  po_prefix: string;
  grn_prefix: string;
  inv_prefix: string;
  pr_numbering_format: string;
  rfq_numbering_format: string;
  po_numbering_format: string;
  grn_numbering_format: string;
  approval_threshold_level1: number;
  approval_threshold_level2: number;
  default_tax_rate: number;
  default_currency: string;
  auto_create_grn: boolean;
  require_3way_match: boolean;
  e_invoice_enabled: boolean;
  e_invoice_provider?: string;
  e_invoice_credentials: any;
  created_at: string;
  updated_at: string;
}

// ============= FORM DATA TYPES =============
export interface RFQFormData {
  pr_id?: string;
  due_date?: string;
  incoterm?: string;
  currency?: string;
  notes?: string;
  vendor_ids: string[];
  lines: {
    product_id?: string;
    description: string;
    quantity: number;
    uom: string;
    target_price?: number;
    notes?: string;
  }[];
}

export interface RFQQuoteFormData {
  rfq_id: string;
  vendor_id: string;
  currency: string;
  exchange_rate?: number;
  valid_until?: string;
  delivery_days?: number;
  shipping_cost?: number;
  discount_rate?: number;
  payment_terms?: string;
  notes?: string;
  lines: {
    rfq_line_id: string;
    unit_price: number;
    tax_rate?: number;
    discount_rate?: number;
    delivery_days?: number;
    notes?: string;
  }[];
}

export interface GRNFormData {
  po_id: string;
  received_date: string;
  warehouse_id?: string;
  notes?: string;
  lines: {
    po_line_id: string;
    received_quantity: number;
    qc_status?: QCStatus;
    location_id?: string;
    serials?: any[];
    batches?: any[];
    notes?: string;
  }[];
}

export interface VendorInvoiceFormData {
  invoice_number: string;
  invoice_date: string;
  vendor_id: string;
  po_id?: string;
  grn_id?: string;
  currency?: string;
  exchange_rate?: number;
  due_date?: string;
  payment_terms?: string;
  e_invoice_uuid?: string;
  notes?: string;
  lines: {
    po_line_id?: string;
    product_id?: string;
    description: string;
    quantity: number;
    uom: string;
    unit_price: number;
    tax_rate?: number;
    discount_rate?: number;
  }[];
}
