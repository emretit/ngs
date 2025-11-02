// Deliveries (Teslimatlar) için TypeScript type tanımları

export type DeliveryStatus = 
  | 'pending'      // Beklemede
  | 'prepared'     // Hazırlandı
  | 'shipped'      // Kargoya Verildi
  | 'delivered'    // Teslim Edildi
  | 'cancelled';   // İptal Edildi

export type ShippingMethod = 
  | 'kargo'           // Kargo ile
  | 'sirket_araci'    // Şirket Aracı
  | 'musteri_alacak'  // Müşteri Alacak
  | 'diger';          // Diğer

export interface DeliveryItem {
  id: string;
  delivery_id: string;
  order_item_id?: string;
  product_id?: string;
  product_name: string;
  quantity: number;
  unit: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Delivery {
  id: string;
  company_id: string;
  delivery_number: string;
  order_id?: string;
  sales_invoice_id?: string;
  customer_id: string;
  employee_id?: string;
  status: DeliveryStatus;
  planned_delivery_date?: string;
  actual_delivery_date?: string;
  delivery_address?: string;
  delivery_contact_name?: string;
  delivery_contact_phone?: string;
  shipping_method?: ShippingMethod;
  carrier_name?: string;
  tracking_number?: string;
  delivered_by?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  
  // İlişkili veriler (join ile gelecek)
  customer?: {
    id: string;
    name: string;
    company?: string;
    email?: string;
    mobile_phone?: string;
    office_phone?: string;
    address?: string;
  };
  order?: {
    id: string;
    order_number: string;
    title: string;
    status: string;
  };
  sales_invoice?: {
    id: string;
    fatura_no: string;
    document_type?: string;
  };
  employee?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  delivered_by_employee?: {
    id: string;
    first_name: string;
    last_name: string;
  };
  items?: DeliveryItem[];
}

export interface CreateDeliveryData {
  order_id?: string;
  sales_invoice_id?: string;
  customer_id: string;
  employee_id?: string;
  status?: DeliveryStatus;
  planned_delivery_date?: string;
  delivery_address?: string;
  delivery_contact_name?: string;
  delivery_contact_phone?: string;
  shipping_method?: ShippingMethod;
  carrier_name?: string;
  tracking_number?: string;
  notes?: string;
  items: CreateDeliveryItemData[];
}

export interface CreateDeliveryItemData {
  order_item_id?: string;
  product_id?: string;
  product_name: string;
  quantity: number;
  unit?: string;
  notes?: string;
}

export interface UpdateDeliveryData {
  status?: DeliveryStatus;
  planned_delivery_date?: string;
  actual_delivery_date?: string;
  delivery_address?: string;
  delivery_contact_name?: string;
  delivery_contact_phone?: string;
  shipping_method?: ShippingMethod;
  carrier_name?: string;
  tracking_number?: string;
  delivered_by?: string;
  notes?: string;
  items?: CreateDeliveryItemData[];
}

export interface DeliveryFilters {
  status?: DeliveryStatus | 'all';
  customer_id?: string | 'all';
  shipping_method?: ShippingMethod | 'all';
  search?: string;
  dateRange?: {
    from: Date | null;
    to: Date | null;
  };
  page?: number;
  pageSize?: number;
}

export interface DeliveryStats {
  total: number;
  pending: number;
  prepared: number;
  shipped: number;
  delivered: number;
  cancelled: number;
}
