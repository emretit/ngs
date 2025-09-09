
export type PurchaseRequestStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'converted';
export type PurchaseOrderStatus = 'draft' | 'sent' | 'confirmed' | 'received' | 'partially_received' | 'cancelled';
export type InvoiceStatus = 'pending' | 'paid' | 'partially_paid' | 'overdue' | 'cancelled';

export interface PurchaseRequest {
  id: string;
  request_number: string;
  title: string;
  description: string | null;
  requester_id: string;
  department: string | null;
  preferred_supplier_id: string | null;
  total_budget: number;
  status: PurchaseRequestStatus;
  notes: string | null;
  requested_date: string;
  needed_by_date: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PurchaseRequestItem {
  id: string;
  request_id: string;
  product_id: string | null;
  description: string;
  quantity: number;
  unit: string;
  estimated_unit_price: number | null;
  estimated_total: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PurchaseOrder {
  id: string;
  po_number: string;
  request_id: string | null;
  supplier_id: string;
  status: PurchaseOrderStatus;
  currency: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  payment_terms: string | null;
  delivery_terms: string | null;
  delivery_address: string | null;
  notes: string | null;
  issued_by: string | null;
  issued_date: string | null;
  expected_delivery_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface PurchaseOrderItem {
  id: string;
  po_id: string;
  product_id: string | null;
  description: string;
  quantity: number;
  received_quantity: number;
  unit: string;
  unit_price: number;
  tax_rate: number;
  discount_rate: number;
  total_price: number;
  created_at: string;
  updated_at: string;
}

export interface PurchaseInvoice {
  id: string;
  invoice_number: string;
  po_id: string | null;
  supplier_id: string;
  status: InvoiceStatus;
  currency: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  paid_amount: number;
  invoice_date: string;
  due_date: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PurchaseRequestFormData {
  title: string;
  description: string;
  department: string;
  preferred_supplier_id: string | null;
  total_budget: number;
  notes: string;
  needed_by_date: string | null;
  items: PurchaseRequestItemFormData[];
}

export interface PurchaseRequestItemFormData {
  id?: string;
  product_id: string | null;
  description: string;
  quantity: number;
  unit: string;
  estimated_unit_price: number | null;
  estimated_total: number | null;
  notes: string;
}

export interface PurchaseOrderFormData {
  request_id: string | null;
  supplier_id: string;
  currency: string;
  payment_terms: string;
  delivery_terms: string;
  delivery_address: string;
  notes: string;
  expected_delivery_date: string | null;
  items: PurchaseOrderItemFormData[];
}

export interface PurchaseOrderItemFormData {
  id?: string;
  product_id: string | null;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  tax_rate: number;
  discount_rate: number;
  total_price: number;
}

export interface PurchaseInvoiceFormData {
  invoice_number: string;
  po_id: string | null;
  supplier_id: string;
  currency: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  paid_amount: number;
  invoice_date: string;
  due_date: string;
  notes: string;
}
