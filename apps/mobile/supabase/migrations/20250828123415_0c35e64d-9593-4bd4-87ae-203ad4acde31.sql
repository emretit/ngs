-- Fix user_roles RLS policies to prevent infinite recursion
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles in their company" ON public.user_roles;

-- Create simple company-based policy for user_roles
CREATE POLICY "Company-based user roles access" 
ON public.user_roles 
FOR ALL 
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());