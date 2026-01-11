
export interface Supplier {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export interface ProductCategory {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  formatted_description?: any;
  sku: string | null;
  barcode: string | null;
  price: number;
  discount_price: number | null;
  currency: string;
  exchange_rate?: number;
  tax_rate: number;
  stock_quantity: number;
  reserved_quantity?: number; // Reserved stock for confirmed orders
  available_stock?: number;   // Calculated: stock_quantity - reserved_quantity
  min_stock_level: number;
  stock_threshold: number;
  unit: string;
  category_id: string;
  category_type: string;
  product_type: string;
  status: string;
  is_active: boolean;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  last_purchase_date?: string | null;
  related_products?: string[];
  product_categories: ProductCategory | null;
  suppliers?: Supplier | null;
  purchase_price?: number;
  // For proposal integration - storing original values
  original_currency?: string;
  original_price?: number;
}
