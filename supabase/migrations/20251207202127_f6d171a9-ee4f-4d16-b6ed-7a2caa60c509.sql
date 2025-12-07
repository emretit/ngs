-- =====================================================
-- FIX SECURITY ISSUES: Enable RLS and Fix Policies
-- =====================================================

-- 1. ORDERS TABLE - Enable RLS and add company-scoped policies
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company users can view orders"
ON public.orders FOR SELECT
USING (company_id = current_company_id());

CREATE POLICY "Company users can insert orders"
ON public.orders FOR INSERT
WITH CHECK (company_id = current_company_id());

CREATE POLICY "Company users can update orders"
ON public.orders FOR UPDATE
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

CREATE POLICY "Company users can delete orders"
ON public.orders FOR DELETE
USING (company_id = current_company_id());

-- 2. ORDER_ITEMS TABLE - Enable RLS with join-based policies
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company users can view order items"
ON public.order_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
    AND orders.company_id = current_company_id()
  )
);

CREATE POLICY "Company users can insert order items"
ON public.order_items FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
    AND orders.company_id = current_company_id()
  )
);

CREATE POLICY "Company users can update order items"
ON public.order_items FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
    AND orders.company_id = current_company_id()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
    AND orders.company_id = current_company_id()
  )
);

CREATE POLICY "Company users can delete order items"
ON public.order_items FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
    AND orders.company_id = current_company_id()
  )
);

-- 3. E_INVOICE_DRAFTS TABLE - Enable RLS and add company-scoped policies
ALTER TABLE public.e_invoice_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company users can view e-invoice drafts"
ON public.e_invoice_drafts FOR SELECT
USING (company_id = current_company_id());

CREATE POLICY "Company users can insert e-invoice drafts"
ON public.e_invoice_drafts FOR INSERT
WITH CHECK (company_id = current_company_id());

CREATE POLICY "Company users can update e-invoice drafts"
ON public.e_invoice_drafts FOR UPDATE
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

CREATE POLICY "Company users can delete e-invoice drafts"
ON public.e_invoice_drafts FOR DELETE
USING (company_id = current_company_id());

-- 4. E_INVOICE_SETTINGS TABLE - Enable RLS and add company-scoped policies
ALTER TABLE public.e_invoice_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company users can view e-invoice settings"
ON public.e_invoice_settings FOR SELECT
USING (company_id = current_company_id());

CREATE POLICY "Company users can insert e-invoice settings"
ON public.e_invoice_settings FOR INSERT
WITH CHECK (company_id = current_company_id());

CREATE POLICY "Company users can update e-invoice settings"
ON public.e_invoice_settings FOR UPDATE
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

CREATE POLICY "Company users can delete e-invoice settings"
ON public.e_invoice_settings FOR DELETE
USING (company_id = current_company_id());

-- 5. SUBTASKS TABLE - Enable RLS with join-based policies through activities
ALTER TABLE public.subtasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company users can view subtasks"
ON public.subtasks FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM activities
    WHERE activities.id = subtasks.task_id
    AND activities.company_id = current_company_id()
  )
);

CREATE POLICY "Company users can insert subtasks"
ON public.subtasks FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM activities
    WHERE activities.id = subtasks.task_id
    AND activities.company_id = current_company_id()
  )
);

CREATE POLICY "Company users can update subtasks"
ON public.subtasks FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM activities
    WHERE activities.id = subtasks.task_id
    AND activities.company_id = current_company_id()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM activities
    WHERE activities.id = subtasks.task_id
    AND activities.company_id = current_company_id()
  )
);

CREATE POLICY "Company users can delete subtasks"
ON public.subtasks FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM activities
    WHERE activities.id = subtasks.task_id
    AND activities.company_id = current_company_id()
  )
);

-- 6. SUPPLIERS TABLE - Fix the permissive "ELSE true" policy
DROP POLICY IF EXISTS "Company-based access" ON public.suppliers;

CREATE POLICY "Company users can view suppliers"
ON public.suppliers FOR SELECT
USING (current_company_id() IS NOT NULL AND company_id = current_company_id());

CREATE POLICY "Company users can insert suppliers"
ON public.suppliers FOR INSERT
WITH CHECK (current_company_id() IS NOT NULL AND company_id = current_company_id());

CREATE POLICY "Company users can update suppliers"
ON public.suppliers FOR UPDATE
USING (current_company_id() IS NOT NULL AND company_id = current_company_id())
WITH CHECK (current_company_id() IS NOT NULL AND company_id = current_company_id());

CREATE POLICY "Company users can delete suppliers"
ON public.suppliers FOR DELETE
USING (current_company_id() IS NOT NULL AND company_id = current_company_id());