// Production (Üretim) için TypeScript type tanımları

export type WorkOrderStatus = 
  | 'draft'        // Taslak
  | 'planned'      // Planlandı
  | 'in_progress'  // Üretimde
  | 'completed'    // Tamamlandı
  | 'cancelled';   // İptal Edildi

export type WorkOrderPriority = 'low' | 'medium' | 'high';

export interface BOMItem {
  id: string;
  bom_id: string;
  item_name: string;
  quantity: number;
  unit: string;
  created_at: string;
}

export interface BOM {
  id: string;
  company_id: string;
  name: string;
  description?: string;
  product_id?: string;
  product_name?: string;
  created_at: string;
  updated_at: string;
  
  // İlişkili veriler
  items?: BOMItem[];
}

export interface WorkOrderOperation {
  id: string;
  work_order_id: string;
  name: string;
  status: 'pending' | 'in_progress' | 'completed';
  order_index: number;
  assigned_to?: string;
  notes?: string;
  created_at: string;
}

export interface WorkOrder {
  id: string;
  company_id: string;
  order_number: number;
  title: string;
  description?: string;
  
  bom_id?: string;
  bom_name?: string; // Join ile gelebilir veya frontend'de eşleştirilebilir
  
  quantity: number;
  status: WorkOrderStatus;
  priority: WorkOrderPriority;
  
  planned_start_date?: string;
  planned_end_date?: string;
  actual_start_date?: string;
  actual_end_date?: string;
  
  assigned_to?: string; // User ID
  
  created_at: string;
  updated_at: string;
  
  // İlişkili veriler
  bom?: BOM;
  operations?: WorkOrderOperation[];
  assignee?: {
    first_name?: string;
    last_name?: string;
    email?: string;
  };
}

export interface CreateWorkOrderData {
  title: string;
  description?: string;
  bom_id?: string;
  quantity: number;
  status?: WorkOrderStatus;
  priority?: WorkOrderPriority;
  planned_start_date?: string;
  planned_end_date?: string;
  assigned_to?: string;
}

export interface CreateBOMData {
  name: string;
  description?: string;
  product_id?: string;
  product_name?: string;
  items: {
    item_name: string;
    quantity: number;
    unit: string;
  }[];
}

export interface WorkOrderFilters {
  status?: WorkOrderStatus | 'all';
  search?: string;
  dateRange?: {
    from: Date | null;
    to: Date | null;
  };
  page?: number;
  pageSize?: number;
}

export interface ProductionStats {
  active_work_orders: number;
  completed_this_month: number;
  bom_count: number;
  planned_this_week: number;
}
