// ==========================================
// SUPPLIER PORTAL TYPES
// Tedarikçi portalı için type tanımları
// ==========================================

// Portal Token
export interface SupplierPortalToken {
  id: string;
  company_id: string;
  supplier_id: string;
  token_hash: string;
  email: string;
  expires_at: string;
  is_used: boolean;
  used_at?: string;
  created_at: string;
  created_by?: string;
}

// Portal Session
export interface SupplierPortalSession {
  id: string;
  company_id: string;
  supplier_id: string;
  session_token: string;
  expires_at: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  last_activity: string;
}

// Portal Activity Types
export type PortalActivityType = 
  | 'login' 
  | 'logout' 
  | 'view_rfq' 
  | 'submit_quote' 
  | 'view_order' 
  | 'download_document' 
  | 'upload_document';

// Portal Activity
export interface SupplierPortalActivity {
  id: string;
  company_id: string;
  supplier_id: string;
  activity_type: PortalActivityType;
  object_type?: string;
  object_id?: string;
  metadata?: Record<string, any>;
  ip_address?: string;
  created_at: string;
}

// Portal Supplier (extended)
export interface PortalSupplier {
  id: string;
  company_id: string;
  name: string;
  email?: string;
  mobile_phone?: string;
  office_phone?: string;
  address?: string;
  city?: string;
  country?: string;
  tax_number?: string;
  portal_enabled: boolean;
  portal_email?: string;
  last_portal_login?: string;
}

// Portal RFQ (for supplier view)
export interface PortalRFQ {
  id: string;
  company_id: string;
  rfq_number: string;
  status: 'draft' | 'sent' | 'received' | 'closed' | 'cancelled';
  due_date?: string;
  currency: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  lines: PortalRFQLine[];
  vendor_status?: 'invited' | 'quoted' | 'declined' | 'no_response';
  my_quote?: PortalQuote;
}

// Portal RFQ Line
export interface PortalRFQLine {
  id: string;
  rfq_id: string;
  product_id?: string;
  description: string;
  quantity: number;
  uom: string;
  target_price?: number;
  notes?: string;
}

// Portal Quote (supplier's quote)
export interface PortalQuote {
  id: string;
  rfq_id: string;
  supplier_id: string;
  quote_number?: string;
  currency: string;
  exchange_rate: number;
  valid_until?: string;
  delivery_days?: number;
  shipping_cost: number;
  discount_rate: number;
  payment_terms?: string;
  notes?: string;
  subtotal: number;
  tax_total: number;
  grand_total: number;
  is_selected: boolean;
  submitted_via_portal: boolean;
  submitted_at?: string;
  created_at: string;
  updated_at: string;
  lines: PortalQuoteLine[];
}

// Portal Quote Line
export interface PortalQuoteLine {
  id: string;
  rfq_quote_id: string;
  rfq_line_id: string;
  unit_price: number;
  tax_rate: number;
  discount_rate: number;
  line_total: number;
  delivery_days?: number;
  notes?: string;
}

// Portal Purchase Order (for supplier tracking)
export interface PortalPurchaseOrder {
  id: string;
  company_id: string;
  order_number: string;
  status: 'draft' | 'submitted' | 'confirmed' | 'shipped' | 'received' | 'completed' | 'cancelled';
  order_date: string;
  expected_delivery_date?: string;
  currency: string;
  subtotal: number;
  tax_total: number;
  total_amount: number;
  payment_terms?: string;
  incoterm?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  items: PortalPurchaseOrderItem[];
}

// Portal Purchase Order Item
export interface PortalPurchaseOrderItem {
  id: string;
  order_id: string;
  product_id?: string;
  description: string;
  quantity: number;
  uom: string;
  unit_price: number;
  tax_rate: number;
  discount_rate: number;
  line_total: number;
  received_quantity: number;
  notes?: string;
}

// Portal Auth Context
export interface PortalAuthContext {
  isAuthenticated: boolean;
  supplier: PortalSupplier | null;
  sessionToken: string | null;
  login: (token: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

// Quote Form Data (for submitting quotes)
export interface QuoteFormData {
  currency: string;
  valid_until?: string;
  delivery_days?: number;
  shipping_cost?: number;
  discount_rate?: number;
  payment_terms?: string;
  notes?: string;
  lines: QuoteLineFormData[];
}

export interface QuoteLineFormData {
  rfq_line_id: string;
  unit_price: number;
  tax_rate: number;
  discount_rate?: number;
  delivery_days?: number;
  notes?: string;
}

// Portal Dashboard Stats
export interface PortalDashboardStats {
  activeRFQs: number;
  pendingQuotes: number;
  wonOrders: number;
  totalOrderValue: number;
}

// Invite Form Data
export interface PortalInviteFormData {
  supplier_id: string;
  email: string;
}

