-- Fix sales_invoices RLS policies to match customers table behavior
-- Problem: sales_invoices has complex role-based policies that require user_roles table
-- Solution: Simplify to use only current_company_id() like customers table

-- Drop all existing sales_invoices policies
DROP POLICY IF EXISTS "Admin and management view all sales invoices" ON sales_invoices;
DROP POLICY IF EXISTS "Admin and owner can delete sales invoices" ON sales_invoices;
DROP POLICY IF EXISTS "Authorized users can insert sales invoices" ON sales_invoices;
DROP POLICY IF EXISTS "Authorized users can update sales invoices" ON sales_invoices;
DROP POLICY IF EXISTS "Sales reps view own customer invoices" ON sales_invoices;

-- Create a simple company-based access policy (same as customers table)
CREATE POLICY "Company-based access" ON sales_invoices
FOR ALL
TO authenticated
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- Add comment explaining the policy
COMMENT ON POLICY "Company-based access" ON sales_invoices IS 
'Simple company isolation policy. Users can only access sales_invoices from their current company.';
