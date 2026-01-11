-- Add stock reservation column to products table
-- Migration: 20260111102958_add_stock_reservation

-- Add reserved_quantity column to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS reserved_quantity NUMERIC DEFAULT 0;

-- Add comment to explain the column
COMMENT ON COLUMN products.reserved_quantity IS 'Quantity of stock reserved for confirmed orders but not yet delivered';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_products_reserved_quantity ON products(reserved_quantity);

-- Create index for available stock queries (stock - reserved)
CREATE INDEX IF NOT EXISTS idx_products_available_stock ON products(stock_quantity, reserved_quantity);

-- Create function to check available stock
CREATE OR REPLACE FUNCTION check_available_stock(
  p_product_id UUID,
  p_quantity NUMERIC
) RETURNS BOOLEAN AS $$
DECLARE
  v_stock NUMERIC;
  v_reserved NUMERIC;
  v_available NUMERIC;
BEGIN
  -- Get current stock and reserved quantity
  SELECT 
    COALESCE(stock_quantity, 0),
    COALESCE(reserved_quantity, 0)
  INTO v_stock, v_reserved
  FROM products
  WHERE id = p_product_id;
  
  -- If product not found, return false
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Calculate available stock
  v_available := v_stock - v_reserved;
  
  -- Return true if available stock is sufficient
  RETURN v_available >= p_quantity;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get available stock quantity
CREATE OR REPLACE FUNCTION get_available_stock(
  p_product_id UUID
) RETURNS NUMERIC AS $$
DECLARE
  v_stock NUMERIC;
  v_reserved NUMERIC;
BEGIN
  -- Get current stock and reserved quantity
  SELECT 
    COALESCE(stock_quantity, 0),
    COALESCE(reserved_quantity, 0)
  INTO v_stock, v_reserved
  FROM products
  WHERE id = p_product_id;
  
  -- If product not found, return 0
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- Return available stock (can be negative if over-reserved)
  RETURN v_stock - v_reserved;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments to functions
COMMENT ON FUNCTION check_available_stock(UUID, NUMERIC) IS 'Check if product has sufficient available stock (stock - reserved >= requested quantity)';
COMMENT ON FUNCTION get_available_stock(UUID) IS 'Get available stock for a product (stock - reserved)';

-- Create view for products with stock information
CREATE OR REPLACE VIEW products_with_stock_info AS
SELECT 
  p.*,
  COALESCE(p.stock_quantity, 0) as stock,
  COALESCE(p.reserved_quantity, 0) as reserved,
  COALESCE(p.stock_quantity, 0) - COALESCE(p.reserved_quantity, 0) as available_stock,
  CASE 
    WHEN COALESCE(p.stock_quantity, 0) - COALESCE(p.reserved_quantity, 0) <= 0 THEN 'out_of_stock'
    WHEN COALESCE(p.stock_quantity, 0) - COALESCE(p.reserved_quantity, 0) <= COALESCE(p.min_stock_level, 0) THEN 'low_stock'
    ELSE 'in_stock'
  END as stock_status
FROM products p;

-- Add comment to view
COMMENT ON VIEW products_with_stock_info IS 'Products with calculated available stock and stock status';

-- Grant permissions for the view (RLS still applies through the underlying table)
-- Users with access to products table will automatically have access to this view
