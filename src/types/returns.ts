// Returns (İadeler) için TypeScript type tanımları

export type ReturnStatus = 
  | 'pending'       // Beklemede
  | 'under_review'  // İnceleniyor
  | 'approved'      // Onaylandı
  | 'rejected'      // Reddedildi
  | 'completed'     // Tamamlandı
  | 'cancelled';    // İptal Edildi

export type ReturnType = 
  | 'product_return'  // Ürün İadesi
  | 'exchange'        // Değişim
  | 'refund';         // Para İadesi

export type ReturnReason = 
  | 'defective'           // Defolu Ürün
  | 'wrong_product'       // Yanlış Ürün
  | 'customer_changed_mind' // Müşteri Vazgeçti
  | 'damaged_in_shipping' // Kargoda Hasar
  | 'other';              // Diğer

export type ItemStatus = 
  | 'pending'    // Beklemede
  | 'received'   // Teslim Alındı
  | 'inspected'  // İncelendi
  | 'restocked'  // Stoğa Eklendi
  | 'disposed';  // İmha Edildi

export type ItemCondition = 
  | 'new'       // Yeni
  | 'damaged'   // Hasarlı
  | 'defective' // Defolu
  | 'used';     // Kullanılmış

export interface ReturnItem {
  id: string;
  return_id: string;
  order_item_id?: string;
  product_id?: string;
  product_name: string;
  original_quantity: number;
  return_quantity: number;
  unit: string;
  item_status: ItemStatus;
  condition?: ItemCondition;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Return {
  id: string;
  company_id: string;
  return_number: string;
  order_id?: string;
  delivery_id?: string;
  sales_invoice_id?: string;
  customer_id: string;
  return_type: ReturnType;
  return_reason: ReturnReason;
  reason_description?: string;
  status: ReturnStatus;
  request_date: string;
  review_date?: string;
  completion_date?: string;
  refund_amount: number;
  refund_method?: string;
  currency: string;
  employee_id?: string;
  reviewed_by?: string;
  notes?: string;
  internal_notes?: string;
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
  };
  order?: {
    id: string;
    order_number: string;
    title: string;
  };
  delivery?: {
    id: string;
    delivery_number: string;
  };
  employee?: {
    id: string;
    first_name: string;
    last_name: string;
  };
  reviewed_by_employee?: {
    id: string;
    first_name: string;
    last_name: string;
  };
  items?: ReturnItem[];
}

export interface CreateReturnData {
  order_id?: string;
  delivery_id?: string;
  sales_invoice_id?: string;
  customer_id: string;
  employee_id?: string;
  return_type: ReturnType;
  return_reason: ReturnReason;
  reason_description?: string;
  status?: ReturnStatus;
  request_date?: string;
  refund_amount?: number;
  refund_method?: string;
  currency?: string;
  notes?: string;
  items: CreateReturnItemData[];
}

export interface CreateReturnItemData {
  order_item_id?: string;
  product_id?: string;
  product_name: string;
  original_quantity?: number;
  return_quantity: number;
  unit?: string;
  condition?: ItemCondition;
  notes?: string;
}

export interface UpdateReturnData {
  status?: ReturnStatus;
  return_type?: ReturnType;
  return_reason?: ReturnReason;
  reason_description?: string;
  review_date?: string;
  completion_date?: string;
  refund_amount?: number;
  refund_method?: string;
  reviewed_by?: string;
  notes?: string;
  internal_notes?: string;
  items?: CreateReturnItemData[];
}

export interface ReturnFilters {
  status?: ReturnStatus | 'all';
  customer_id?: string | 'all';
  return_type?: ReturnType | 'all';
  return_reason?: ReturnReason | 'all';
  search?: string;
  dateRange?: {
    from: Date | null;
    to: Date | null;
  };
  page?: number;
  pageSize?: number;
}

export interface ReturnStats {
  total: number;
  pending: number;
  under_review: number;
  approved: number;
  rejected: number;
  completed: number;
  cancelled: number;
}

// Label mappings
export const returnStatusLabels: Record<ReturnStatus, string> = {
  pending: 'Beklemede',
  under_review: 'İnceleniyor',
  approved: 'Onaylandı',
  rejected: 'Reddedildi',
  completed: 'Tamamlandı',
  cancelled: 'İptal Edildi'
};

export const returnTypeLabels: Record<ReturnType, string> = {
  product_return: 'Ürün İadesi',
  exchange: 'Değişim',
  refund: 'Para İadesi'
};

export const returnReasonLabels: Record<ReturnReason, string> = {
  defective: 'Defolu Ürün',
  wrong_product: 'Yanlış Ürün',
  customer_changed_mind: 'Müşteri Vazgeçti',
  damaged_in_shipping: 'Kargoda Hasar',
  other: 'Diğer'
};

export const itemStatusLabels: Record<ItemStatus, string> = {
  pending: 'Beklemede',
  received: 'Teslim Alındı',
  inspected: 'İncelendi',
  restocked: 'Stoğa Eklendi',
  disposed: 'İmha Edildi'
};

export const itemConditionLabels: Record<ItemCondition, string> = {
  new: 'Yeni',
  damaged: 'Hasarlı',
  defective: 'Defolu',
  used: 'Kullanılmış'
};
