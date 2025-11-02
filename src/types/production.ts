// Production (Üretim) için TypeScript type tanımları

export type WorkOrderStatus = 
  | 'planned'      // Planlandı
  | 'in_progress'  // Üretimde
  | 'completed'    // Tamamlandı
  | 'cancelled';    // İptal Edildi

export interface BOMItem {
  id: string;
  bom_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  
  // İlişkili veriler
  product?: {
    id: string;
    name: string;
    sku?: string;
    unit?: string;
  };
}

export interface BOM {
  id: string;
  company_id: string;
  name: string;
  main_product_id: string;
  main_product_name: string;
  version?: string;
  is_active: boolean;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  
  // İlişkili veriler
  main_product?: {
    id: string;
    name: string;
    sku?: string;
  };
  items?: BOMItem[];
}

export interface WorkOrder {
  id: string;
  company_id: string;
  work_order_number: string;
  bom_id?: string;
  bom_name?: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit: string;
  status: WorkOrderStatus;
  planned_start_date?: string;
  planned_end_date?: string;
  actual_start_date?: string;
  actual_end_date?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  
  // İlişkili veriler
  product?: {
    id: string;
    name: string;
    sku?: string;
  };
  bom?: {
    id: string;
    name: string;
    version?: string;
  };
  employee?: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

export interface CreateWorkOrderData {
  bom_id?: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit: string;
  planned_start_date?: string;
  planned_end_date?: string;
  notes?: string;
}

export interface CreateBOMData {
  name: string;
  main_product_id: string;
  main_product_name: string;
  version?: string;
  notes?: string;
  items: {
    product_id: string;
    product_name: string;
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

