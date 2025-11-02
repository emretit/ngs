// Inventory Transactions (Depo İşlemleri) için TypeScript type tanımları

export type TransactionType = 
  | 'giris'      // Stok Girişi
  | 'cikis'      // Stok Çıkışı
  | 'transfer'   // Depo Transferi
  | 'sayim';     // Stok Sayımı

export type TransactionStatus = 
  | 'pending'    // Beklemede
  | 'approved'   // Onaylı
  | 'completed'  // Tamamlandı
  | 'cancelled'; // İptal Edildi

export interface InventoryTransactionItem {
  id: string;
  transaction_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit: string;
  unit_cost?: number;
  notes?: string;
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

export interface InventoryTransaction {
  id: string;
  company_id: string;
  transaction_number: string;
  transaction_type: TransactionType;
  status: TransactionStatus;
  warehouse_id?: string;
  warehouse_name?: string;
  from_warehouse_id?: string;
  from_warehouse_name?: string;
  to_warehouse_id?: string;
  to_warehouse_name?: string;
  transaction_date: string;
  reference_number?: string;
  notes?: string;
  created_by?: string;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
  
  // İlişkili veriler
  employee?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  approved_by_employee?: {
    id: string;
    first_name: string;
    last_name: string;
  };
  warehouse?: {
    id: string;
    name: string;
    code?: string;
  };
  items?: InventoryTransactionItem[];
}

export interface CreateInventoryTransactionData {
  transaction_type: TransactionType;
  warehouse_id?: string;
  from_warehouse_id?: string;
  to_warehouse_id?: string;
  transaction_date: string;
  reference_number?: string;
  notes?: string;
  items: {
    product_id: string;
    product_name: string;
    quantity: number;
    unit: string;
    unit_cost?: number;
    notes?: string;
  }[];
}

export interface UpdateInventoryTransactionData {
  status?: TransactionStatus;
  warehouse_id?: string;
  from_warehouse_id?: string;
  to_warehouse_id?: string;
  transaction_date?: string;
  reference_number?: string;
  notes?: string;
  items?: {
    product_id: string;
    product_name: string;
    quantity: number;
    unit: string;
    unit_cost?: number;
    notes?: string;
  }[];
}

export interface InventoryTransactionFilters {
  transaction_type?: TransactionType | 'all';
  status?: TransactionStatus | 'all';
  warehouse_id?: string | 'all';
  search?: string;
  dateRange?: {
    from: Date | null;
    to: Date | null;
  };
  page?: number;
  pageSize?: number;
}

export interface InventoryTransactionStats {
  total: number;
  pending: number;
  approved: number;
  completed: number;
  cancelled: number;
  by_type: {
    giris: number;
    cikis: number;
    transfer: number;
    sayim: number;
  };
}

