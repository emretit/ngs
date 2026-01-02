// Orders için TypeScript type tanımları

export type OrderStatus = 
  | 'pending'      // Beklemede
  | 'confirmed'    // Onaylandı  
  | 'processing'   // İşlemde
  | 'shipped'      // Kargoda
  | 'delivered'    // Teslim Edildi
  | 'completed'    // Tamamlandı
  | 'serviced'     // Servise Çevrildi
  | 'cancelled';   // İptal Edildi

export interface OrderItem {
  id: string;
  order_id: string;
  product_id?: string;
  name: string;
  description?: string;
  quantity: number;
  unit: string;
  unit_price: number;
  tax_rate: number;
  discount_rate: number;
  total_price: number;
  currency: string;
  original_currency?: string;
  original_price?: number;
  item_group?: string;
  stock_status?: 'in_stock' | 'low_stock' | 'out_of_stock';
  sort_order: number;
  created_at: string;
  updated_at: string;
  company_id: string;
}

export interface Order {
  id: string;
  order_number: string;
  proposal_id?: string;
  customer_id?: string;
  employee_id?: string;
  opportunity_id?: string;
  title: string;
  description?: string;
  notes?: string;
  status: OrderStatus;
  order_date: string;
  expected_delivery_date?: string;
  delivery_date?: string;
  currency: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  payment_terms?: string;
  delivery_terms?: string;
  warranty_terms?: string;
  price_terms?: string;
  other_terms?: string;
  delivery_address?: string;
  delivery_contact_name?: string;
  delivery_contact_phone?: string;
  created_at: string;
  updated_at: string;
  company_id: string;
  
  // İlişkili veriler (join ile gelecek)
  customer?: {
    id: string;
    name: string;
    company?: string;
    email?: string;
    mobile_phone?: string;
    office_phone?: string;
    address?: string;
    tax_number?: string;
    tax_office?: string;
  };
  employee?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    department?: string;
  };
  proposal?: {
    id: string;
    number: string;
    title: string;
    status: string;
  };
  items?: OrderItem[];
}

export interface CreateOrderData {
  proposal_id?: string;
  customer_id?: string;
  employee_id?: string;
  opportunity_id?: string;
  title: string;
  description?: string;
  notes?: string;
  status?: OrderStatus;
  expected_delivery_date?: string;
  currency?: string;
  payment_terms?: string;
  delivery_terms?: string;
  warranty_terms?: string;
  price_terms?: string;
  other_terms?: string;
  delivery_address?: string;
  delivery_contact_name?: string;
  delivery_contact_phone?: string;
  items: CreateOrderItemData[];
}

export interface CreateOrderItemData {
  product_id?: string;
  name: string;
  description?: string;
  quantity: number;
  unit: string;
  unit_price: number;
  tax_rate?: number;
  discount_rate?: number;
  item_group?: string;
  stock_status?: 'in_stock' | 'low_stock' | 'out_of_stock';
  sort_order?: number;
}

export interface UpdateOrderData {
  title?: string;
  description?: string;
  notes?: string;
  status?: OrderStatus;
  expected_delivery_date?: string;
  delivery_date?: string;
  currency?: string;
  payment_terms?: string;
  delivery_terms?: string;
  warranty_terms?: string;
  price_terms?: string;
  other_terms?: string;
  delivery_address?: string;
  delivery_contact_name?: string;
  delivery_contact_phone?: string;
  items?: CreateOrderItemData[];
}

export interface OrderFilters {
  status?: OrderStatus | 'all';
  customer_id?: string | 'all';
  search?: string;
  dateRange?: {
    from: Date | null;
    to: Date | null;
  };
  page?: number;
  pageSize?: number;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface OrderStats {
  total: number;
  pending: number;
  confirmed: number;
  processing: number;
  shipped: number;
  delivered: number;
  completed: number;
  serviced: number;
  cancelled: number;
  total_value: number;
}
