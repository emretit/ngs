-- Returns (İadeler) tablosu
CREATE TABLE public.returns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  return_number TEXT NOT NULL,
  
  -- Bağlantılar
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  delivery_id UUID REFERENCES public.deliveries(id) ON DELETE SET NULL,
  sales_invoice_id UUID REFERENCES public.sales_invoices(id) ON DELETE SET NULL,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  
  -- İade Bilgileri
  return_type TEXT NOT NULL DEFAULT 'product_return',
  return_reason TEXT NOT NULL,
  reason_description TEXT,
  
  -- Durum
  status TEXT NOT NULL DEFAULT 'pending',
  
  -- Tarihler
  request_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  review_date TIMESTAMPTZ,
  completion_date TIMESTAMPTZ,
  
  -- Finansal
  refund_amount NUMERIC DEFAULT 0,
  refund_method TEXT,
  currency TEXT DEFAULT 'TRY',
  
  -- Sorumlu kişi
  employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  reviewed_by UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  
  -- Diğer
  notes TEXT,
  internal_notes TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Return Items tablosu
CREATE TABLE public.return_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  return_id UUID NOT NULL REFERENCES public.returns(id) ON DELETE CASCADE,
  
  -- Ürün Bilgileri
  order_item_id UUID REFERENCES public.order_items(id) ON DELETE SET NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  
  -- Miktar
  original_quantity NUMERIC NOT NULL DEFAULT 0,
  return_quantity NUMERIC NOT NULL,
  unit TEXT NOT NULL DEFAULT 'adet',
  
  -- Durum
  item_status TEXT DEFAULT 'pending',
  condition TEXT,
  
  notes TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexler
CREATE INDEX idx_returns_company_id ON public.returns(company_id);
CREATE INDEX idx_returns_customer_id ON public.returns(customer_id);
CREATE INDEX idx_returns_status ON public.returns(status);
CREATE INDEX idx_returns_request_date ON public.returns(request_date);
CREATE INDEX idx_return_items_return_id ON public.return_items(return_id);

-- Updated at trigger
CREATE TRIGGER update_returns_updated_at
  BEFORE UPDATE ON public.returns
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER update_return_items_updated_at
  BEFORE UPDATE ON public.return_items
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.return_items ENABLE ROW LEVEL SECURITY;

-- Returns RLS policies
CREATE POLICY "returns_select_policy" ON public.returns
  FOR SELECT USING (company_id = public.current_company_id());

CREATE POLICY "returns_insert_policy" ON public.returns
  FOR INSERT WITH CHECK (company_id = public.current_company_id());

CREATE POLICY "returns_update_policy" ON public.returns
  FOR UPDATE USING (company_id = public.current_company_id());

CREATE POLICY "returns_delete_policy" ON public.returns
  FOR DELETE USING (company_id = public.current_company_id());

-- Return Items RLS policies
CREATE POLICY "return_items_select_policy" ON public.return_items
  FOR SELECT USING (
    return_id IN (SELECT id FROM public.returns WHERE company_id = public.current_company_id())
  );

CREATE POLICY "return_items_insert_policy" ON public.return_items
  FOR INSERT WITH CHECK (
    return_id IN (SELECT id FROM public.returns WHERE company_id = public.current_company_id())
  );

CREATE POLICY "return_items_update_policy" ON public.return_items
  FOR UPDATE USING (
    return_id IN (SELECT id FROM public.returns WHERE company_id = public.current_company_id())
  );

CREATE POLICY "return_items_delete_policy" ON public.return_items
  FOR DELETE USING (
    return_id IN (SELECT id FROM public.returns WHERE company_id = public.current_company_id())
  );

-- Return number generator function
CREATE OR REPLACE FUNCTION public.generate_return_number(p_company_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_year TEXT;
  v_prefix TEXT;
  v_next_num INTEGER;
BEGIN
  v_year := TO_CHAR(CURRENT_DATE, 'YYYY');
  v_prefix := 'IADE-' || v_year || '-';
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(return_number FROM LENGTH(v_prefix) + 1) AS INTEGER)), 0) + 1
  INTO v_next_num
  FROM returns
  WHERE company_id = p_company_id AND return_number LIKE v_prefix || '%';
  
  RETURN v_prefix || LPAD(v_next_num::TEXT, 4, '0');
END;
$$;