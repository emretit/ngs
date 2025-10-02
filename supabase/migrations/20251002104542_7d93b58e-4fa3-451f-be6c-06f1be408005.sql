-- SPRINT 2: Purchase Orders & Items Tables

-- Drop existing objects if they exist
DROP TABLE IF EXISTS public.purchase_order_items CASCADE;
DROP TABLE IF EXISTS public.purchase_orders CASCADE;
DROP FUNCTION IF EXISTS check_purchase_order_company(UUID);
DROP FUNCTION IF EXISTS update_purchase_orders_updated_at();
DROP FUNCTION IF EXISTS update_purchase_order_items_updated_at();

-- Purchase Orders table
CREATE TABLE public.purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id),
  order_number TEXT NOT NULL UNIQUE,
  request_id UUID REFERENCES public.purchase_requests(id),
  supplier_id UUID REFERENCES public.customers(id),
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_delivery_date DATE,
  status TEXT NOT NULL DEFAULT 'draft',
  priority TEXT NOT NULL DEFAULT 'normal',
  payment_terms TEXT,
  delivery_address TEXT,
  notes TEXT,
  subtotal NUMERIC(15,2) DEFAULT 0,
  tax_total NUMERIC(15,2) DEFAULT 0,
  total_amount NUMERIC(15,2) DEFAULT 0,
  currency TEXT DEFAULT 'TRY',
  created_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Purchase Order Items table
CREATE TABLE public.purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  description TEXT NOT NULL,
  quantity NUMERIC(15,3) NOT NULL,
  unit_price NUMERIC(15,2) NOT NULL,
  tax_rate NUMERIC(5,2) DEFAULT 18,
  discount_rate NUMERIC(5,2) DEFAULT 0,
  line_total NUMERIC(15,2) NOT NULL,
  uom TEXT DEFAULT 'Adet',
  notes TEXT,
  received_quantity NUMERIC(15,3) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_purchase_orders_company ON public.purchase_orders(company_id);
CREATE INDEX idx_purchase_orders_supplier ON public.purchase_orders(supplier_id);
CREATE INDEX idx_purchase_orders_request ON public.purchase_orders(request_id);
CREATE INDEX idx_purchase_orders_status ON public.purchase_orders(status);
CREATE INDEX idx_purchase_order_items_order ON public.purchase_order_items(order_id);
CREATE INDEX idx_purchase_order_items_product ON public.purchase_order_items(product_id);

-- Triggers for updated_at
CREATE FUNCTION update_purchase_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_purchase_orders_updated_at
BEFORE UPDATE ON public.purchase_orders
FOR EACH ROW
EXECUTE FUNCTION update_purchase_orders_updated_at();

CREATE FUNCTION update_purchase_order_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_purchase_order_items_updated_at
BEFORE UPDATE ON public.purchase_order_items
FOR EACH ROW
EXECUTE FUNCTION update_purchase_order_items_updated_at();

-- Enable RLS
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for purchase_orders
CREATE POLICY "Company-based access on purchase_orders"
ON public.purchase_orders
FOR ALL
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- Security definer function for purchase_order_items RLS
CREATE FUNCTION check_purchase_order_company(p_order_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM purchase_orders
    WHERE id = p_order_id
    AND company_id = current_company_id()
  );
$$;

-- RLS Policies for purchase_order_items
CREATE POLICY "Company-based access on purchase_order_items"
ON public.purchase_order_items
FOR ALL
USING (check_purchase_order_company(order_id))
WITH CHECK (check_purchase_order_company(order_id));