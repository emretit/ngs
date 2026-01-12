-- Drop overly permissive legacy RLS policies on sales_invoices that bypass role-based access
-- These policies allow any authenticated company user to access data without role checks

-- Drop legacy ALL policy that is too permissive
DROP POLICY IF EXISTS "Company isolation for sales_invoices" ON sales_invoices;

-- Drop legacy INSERT policy without role restrictions
DROP POLICY IF EXISTS "Users can insert sales invoices for their company" ON sales_invoices;

-- Drop legacy UPDATE policy without role restrictions
DROP POLICY IF EXISTS "Users can update sales invoices for their company" ON sales_invoices;

-- Drop legacy DELETE policy without role restrictions
DROP POLICY IF EXISTS "Users can delete sales invoices for their company" ON sales_invoices;

-- The following role-based policies already exist and will remain:
-- - "Admin and management view all sales invoices" (SELECT for admin, owner, manager)
-- - "Sales reps view own customer invoices" (SELECT for their own customers)
-- - "Authorized users can insert sales invoices" (INSERT with role check)
-- - "Authorized users can update sales invoices" (UPDATE with role check)
-- - "Admin and owner can delete sales invoices" (DELETE for admin, owner only)