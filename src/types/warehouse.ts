// Warehouses (Depolar) için TypeScript type tanımları

export interface Warehouse {
  id: string;
  company_id: string;
  name: string;
  code?: string;
  address?: string;
  city?: string;
  district?: string;
  country?: string;
  postal_code?: string;
  phone?: string;
  email?: string;
  manager_name?: string;
  manager_phone?: string;
  manager_email?: string;
  warehouse_type?: 'main' | 'sub' | 'virtual' | 'transit';
  is_active: boolean;
  capacity?: number;
  capacity_unit?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  
  // Computed fields (API'den gelecek veya hesaplanacak)
  total_products?: number;
  total_value?: number;
  last_transaction_date?: string;
}

export interface CreateWarehouseData {
  name: string;
  code?: string;
  address?: string;
  city?: string;
  district?: string;
  country?: string;
  postal_code?: string;
  phone?: string;
  email?: string;
  manager_name?: string;
  manager_phone?: string;
  manager_email?: string;
  warehouse_type?: 'main' | 'sub' | 'virtual' | 'transit';
  is_active?: boolean;
  capacity?: number;
  capacity_unit?: string;
  notes?: string;
}

export interface UpdateWarehouseData {
  name?: string;
  code?: string;
  address?: string;
  city?: string;
  district?: string;
  country?: string;
  postal_code?: string;
  phone?: string;
  email?: string;
  manager_name?: string;
  manager_phone?: string;
  manager_email?: string;
  warehouse_type?: 'main' | 'sub' | 'virtual' | 'transit';
  is_active?: boolean;
  capacity?: number;
  capacity_unit?: string;
  notes?: string;
}

export interface WarehouseStats {
  total: number;
  active: number;
  inactive: number;
  by_type: {
    main: number;
    sub: number;
    virtual: number;
    transit: number;
  };
}

export interface WarehouseFilters {
  search?: string;
  warehouse_type?: 'main' | 'sub' | 'virtual' | 'transit' | 'all';
  is_active?: boolean | 'all';
  city?: string;
}

