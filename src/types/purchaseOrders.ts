// SPRINT 2: Purchase Orders Types

export type PurchaseOrderStatus = 'draft' | 'submitted' | 'confirmed' | 'partial_received' | 'received' | 'cancelled';
export type PurchaseOrderPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface PurchaseOrder {
  id: string;
  company_id: string;
  order_number: string;
  request_id?: string;
  supplier_id?: string;
  order_date: string;
  expected_delivery_date?: string;
  status: PurchaseOrderStatus;
  priority: PurchaseOrderPriority;
  payment_terms?: string;
  delivery_address?: string;
  notes?: string;
  subtotal: number;
  tax_total: number;
  total_amount: number;
  currency: string;
  created_by?: string;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
  
  // Relations
  supplier?: {
    id: string;
    name: string;
    email: string;
    phone: string;
    address?: string;
    tax_number?: string;
  };
  request?: {
    request_number: string;
  };
  items?: PurchaseOrderItem[];
}

export interface PurchaseOrderItem {
  id: string;
  order_id: string;
  product_id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  discount_rate: number;
  line_total: number;
  uom: string;
  notes?: string;
  received_quantity: number;
  
  // Relations
  product?: {
    name: string;
    code: string;
  };
}

export interface PurchaseOrderFormData {
  request_id?: string;
  supplier_id: string;
  order_date: string;
  expected_delivery_date?: string;
  priority: PurchaseOrderPriority;
  payment_terms?: string;
  delivery_address?: string;
  incoterm?: string;
  notes?: string;
  currency?: string;
  exchange_rate?: number;
  items: {
    product_id?: string;
    description: string;
    quantity: number;
    unit_price: number;
    tax_rate?: number;
    discount_rate?: number;
    uom?: string;
    notes?: string;
  }[];
}
