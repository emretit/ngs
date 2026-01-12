-- Fix 1: DROP the dangerous execute_readonly_query function (SQL Injection vulnerability)
DROP FUNCTION IF EXISTS public.execute_readonly_query(text);

-- Create role-based INSERT policy (only admin, owner, manager, sales can create invoices)
CREATE POLICY "Authorized users can insert sales invoices"
ON public.sales_invoices
FOR INSERT
TO authenticated
WITH CHECK (
  company_id = current_company_id()
  AND EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.company_id = current_company_id()
    AND ur.role IN ('admin', 'owner', 'manager', 'sales')
  )
);

-- Create role-based UPDATE policy (only admin, owner, manager can update invoices)
CREATE POLICY "Authorized users can update sales invoices"
ON public.sales_invoices
FOR UPDATE
TO authenticated
USING (
  company_id = current_company_id()
  AND EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.company_id = current_company_id()
    AND ur.role IN ('admin', 'owner', 'manager')
  )
);

-- Create role-based DELETE policy (only admin and owner can delete invoices)
CREATE POLICY "Admin and owner can delete sales invoices"
ON public.sales_invoices
FOR DELETE
TO authenticated
USING (
  company_id = current_company_id()
  AND EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.company_id = current_company_id()
    AND ur.role IN ('admin', 'owner')
  )
);