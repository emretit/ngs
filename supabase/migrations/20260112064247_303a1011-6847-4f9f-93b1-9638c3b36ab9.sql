-- Fix security definer views by adding security_invoker = true

-- Fix products_with_stock_info view
ALTER VIEW products_with_stock_info SET (security_invoker = true);

-- Note: geography_columns and geometry_columns are PostGIS system views and cannot be modified.
-- They are created by the PostGIS extension and are safe as they only contain public geospatial reference data.

-- Fix profiles RLS policies to restrict cross-company access
-- Drop the overly permissive profiles_select policy
DROP POLICY IF EXISTS "profiles_select" ON profiles;

-- Create new restricted policies for profiles
-- 1. Users can always view their own profile
CREATE POLICY "profiles_view_own" 
ON profiles FOR SELECT 
TO authenticated
USING (id = auth.uid());

-- 2. Users can view other profiles ONLY within their current active company
CREATE POLICY "profiles_view_current_company" 
ON profiles FOR SELECT 
TO authenticated
USING (
  company_id = current_company_id()
  AND id != auth.uid()
);

-- Fix sales_invoices RLS policies to be role-based
-- The current policies are too permissive - all company members can view all invoices

-- First, drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Users can view sales invoices for their company" ON sales_invoices;

-- Create role-based SELECT policies for sales_invoices
-- 1. Admin/Owner/Manager can view all company invoices
CREATE POLICY "Admin and management view all sales invoices"
ON sales_invoices FOR SELECT
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

-- 2. Sales reps can view invoices for customers they are assigned to or invoices they created
CREATE POLICY "Sales reps view own customer invoices"
ON sales_invoices FOR SELECT
TO authenticated
USING (
  company_id = current_company_id()
  AND (
    -- Their assigned customers
    customer_id IN (
      SELECT c.id FROM customers c
      INNER JOIN employees e ON e.id = c.representative
      WHERE e.user_id = auth.uid()
      AND c.company_id = current_company_id()
    )
    OR
    -- Or invoice has their employee_id
    employee_id = (
      SELECT e.id FROM employees e
      WHERE e.user_id = auth.uid()
      AND e.company_id = current_company_id()
      LIMIT 1
    )
  )
);