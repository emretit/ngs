/**
 * Purchase Orders - Shared Types
 */

export interface PurchaseOrder {
  id: string;
  company_id: string;
  order_number: string;
  supplier_id: string;
  status: string;
  order_date: string;
  expected_delivery_date: string | null;
  warehouse_id: string | null;
  currency: string;
  exchange_rate: number;
  subtotal: number;
  tax_total: number;
  discount_total: number;
  shipping_cost: number;
  total_amount: number;
  payment_terms: string | null;
  incoterm: string | null;
  notes: string | null;
  rfq_id: string | null;
  created_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  supplier?: {
    id: string;
    name: string;
    email: string;
    phone: string;
    address?: string;
  };
  items?: PurchaseOrderItem[];
  approvals?: any[];
}

export interface PurchaseOrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  description: string;
  quantity: number;
  uom: string;
  unit_price: number;
  tax_rate: number;
  discount_rate: number;
  line_total: number;
  expected_delivery_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface POFormData {
  supplier_id: string;
  order_date: string;
  expected_delivery_date?: string;
  warehouse_id?: string;
  currency: string;
  exchange_rate?: number;
  payment_terms?: string;
  incoterm?: string;
  notes?: string;
  rfq_id?: string;
  items: {
    product_id?: string;
    description: string;
    quantity: number;
    uom: string;
    unit_price: number;
    tax_rate?: number;
    discount_rate?: number;
    notes?: string;
  }[];
}

export interface PurchaseOrderFilters {
  status?: string;
  search?: string;
  supplier_id?: string;
  warehouse_id?: string;
  dateRange?: { from: Date | null; to: Date | null };
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  startDate?: string;
  endDate?: string;
}
