-- Add is_super_admin column to user_roles table
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT false;

-- Update RLS policies for companies table to allow super admins full access
DROP POLICY IF EXISTS "Super admins can view all companies" ON public.companies;
CREATE POLICY "Super admins can view all companies"
  ON public.companies
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND is_super_admin = true
    )
    OR id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "Super admins can insert companies" ON public.companies;
CREATE POLICY "Super admins can insert companies"
  ON public.companies
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND is_super_admin = true
    )
  );

DROP POLICY IF EXISTS "Super admins can update companies" ON public.companies;
CREATE POLICY "Super admins can update companies"
  ON public.companies
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND is_super_admin = true
    )
    OR id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "Super admins can delete companies" ON public.companies;
CREATE POLICY "Super admins can delete companies"
  ON public.companies
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND is_super_admin = true
    )
  );

-- Function to check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(user_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = user_id_param AND is_super_admin = true
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.is_super_admin(uuid) TO authenticated;