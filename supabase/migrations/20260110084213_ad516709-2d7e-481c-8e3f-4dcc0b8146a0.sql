-- =============================================================
-- Security Migration: Restrict Auth Table Access to Admin/Owner Only
-- =============================================================

-- Create helper function to check if user is admin/owner
-- Uses is_super_admin flag or checks for admin roles by name
CREATE OR REPLACE FUNCTION public.is_company_admin_or_owner(_user_id uuid, _company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = _user_id
      AND ur.company_id = _company_id
      AND ur.is_super_admin = true
  )
  OR EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = _user_id
      AND ur.company_id = _company_id
      AND (
        r.name IN ('Admin', 'Owner', 'admin', 'owner', 'Yönetici', 'Sistem Yöneticisi')
        OR r.permissions ? 'settings'
      )
  )
$$;

-- =============================================================
-- 1. Restrict veriban_auth table to admin/owner only
-- =============================================================

-- Drop existing policies on veriban_auth
DROP POLICY IF EXISTS "Company-based access" ON public.veriban_auth;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.veriban_auth;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.veriban_auth;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.veriban_auth;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.veriban_auth;
DROP POLICY IF EXISTS "Users can view their company veriban_auth" ON public.veriban_auth;
DROP POLICY IF EXISTS "Users can insert their company veriban_auth" ON public.veriban_auth;
DROP POLICY IF EXISTS "Users can update their company veriban_auth" ON public.veriban_auth;
DROP POLICY IF EXISTS "Users can delete their company veriban_auth" ON public.veriban_auth;

-- Create admin-only policies for veriban_auth
CREATE POLICY "Admin/Owner can view veriban_auth" 
ON public.veriban_auth 
FOR SELECT 
TO authenticated
USING (
  company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  AND public.is_company_admin_or_owner(auth.uid(), company_id)
);

CREATE POLICY "Admin/Owner can insert veriban_auth" 
ON public.veriban_auth 
FOR INSERT 
TO authenticated
WITH CHECK (
  company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  AND public.is_company_admin_or_owner(auth.uid(), company_id)
);

CREATE POLICY "Admin/Owner can update veriban_auth" 
ON public.veriban_auth 
FOR UPDATE 
TO authenticated
USING (
  company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  AND public.is_company_admin_or_owner(auth.uid(), company_id)
)
WITH CHECK (
  company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  AND public.is_company_admin_or_owner(auth.uid(), company_id)
);

CREATE POLICY "Admin/Owner can delete veriban_auth" 
ON public.veriban_auth 
FOR DELETE 
TO authenticated
USING (
  company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  AND public.is_company_admin_or_owner(auth.uid(), company_id)
);

-- =============================================================
-- 2. Restrict elogo_auth table to admin/owner only
-- =============================================================

-- Drop existing policies on elogo_auth
DROP POLICY IF EXISTS "Company-based access" ON public.elogo_auth;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.elogo_auth;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.elogo_auth;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.elogo_auth;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.elogo_auth;
DROP POLICY IF EXISTS "Users can view their company elogo_auth" ON public.elogo_auth;
DROP POLICY IF EXISTS "Users can insert their company elogo_auth" ON public.elogo_auth;
DROP POLICY IF EXISTS "Users can update their company elogo_auth" ON public.elogo_auth;
DROP POLICY IF EXISTS "Users can delete their company elogo_auth" ON public.elogo_auth;

-- Create admin-only policies for elogo_auth
CREATE POLICY "Admin/Owner can view elogo_auth" 
ON public.elogo_auth 
FOR SELECT 
TO authenticated
USING (
  company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  AND public.is_company_admin_or_owner(auth.uid(), company_id)
);

CREATE POLICY "Admin/Owner can insert elogo_auth" 
ON public.elogo_auth 
FOR INSERT 
TO authenticated
WITH CHECK (
  company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  AND public.is_company_admin_or_owner(auth.uid(), company_id)
);

CREATE POLICY "Admin/Owner can update elogo_auth" 
ON public.elogo_auth 
FOR UPDATE 
TO authenticated
USING (
  company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  AND public.is_company_admin_or_owner(auth.uid(), company_id)
)
WITH CHECK (
  company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  AND public.is_company_admin_or_owner(auth.uid(), company_id)
);

CREATE POLICY "Admin/Owner can delete elogo_auth" 
ON public.elogo_auth 
FOR DELETE 
TO authenticated
USING (
  company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  AND public.is_company_admin_or_owner(auth.uid(), company_id)
);

-- =============================================================
-- 3. Restrict nilvera_auth table to admin/owner only
-- =============================================================

-- Drop existing policies on nilvera_auth
DROP POLICY IF EXISTS "Company-based access" ON public.nilvera_auth;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.nilvera_auth;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.nilvera_auth;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.nilvera_auth;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.nilvera_auth;
DROP POLICY IF EXISTS "Users can view their company nilvera_auth" ON public.nilvera_auth;
DROP POLICY IF EXISTS "Users can insert their company nilvera_auth" ON public.nilvera_auth;
DROP POLICY IF EXISTS "Users can update their company nilvera_auth" ON public.nilvera_auth;
DROP POLICY IF EXISTS "Users can delete their company nilvera_auth" ON public.nilvera_auth;

-- Create admin-only policies for nilvera_auth
CREATE POLICY "Admin/Owner can view nilvera_auth" 
ON public.nilvera_auth 
FOR SELECT 
TO authenticated
USING (
  company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  AND public.is_company_admin_or_owner(auth.uid(), company_id)
);

CREATE POLICY "Admin/Owner can insert nilvera_auth" 
ON public.nilvera_auth 
FOR INSERT 
TO authenticated
WITH CHECK (
  company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  AND public.is_company_admin_or_owner(auth.uid(), company_id)
);

CREATE POLICY "Admin/Owner can update nilvera_auth" 
ON public.nilvera_auth 
FOR UPDATE 
TO authenticated
USING (
  company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  AND public.is_company_admin_or_owner(auth.uid(), company_id)
)
WITH CHECK (
  company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  AND public.is_company_admin_or_owner(auth.uid(), company_id)
);

CREATE POLICY "Admin/Owner can delete nilvera_auth" 
ON public.nilvera_auth 
FOR DELETE 
TO authenticated
USING (
  company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  AND public.is_company_admin_or_owner(auth.uid(), company_id)
);

-- =============================================================
-- 4. Restrict veriban_settings table to admin/owner only
-- =============================================================

-- Drop existing policies on veriban_settings
DROP POLICY IF EXISTS "Company-based access" ON public.veriban_settings;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.veriban_settings;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.veriban_settings;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.veriban_settings;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.veriban_settings;
DROP POLICY IF EXISTS "Users can view their company veriban_settings" ON public.veriban_settings;
DROP POLICY IF EXISTS "Users can insert their company veriban_settings" ON public.veriban_settings;
DROP POLICY IF EXISTS "Users can update their company veriban_settings" ON public.veriban_settings;
DROP POLICY IF EXISTS "Users can delete their company veriban_settings" ON public.veriban_settings;

-- Create admin-only policies for veriban_settings
CREATE POLICY "Admin/Owner can view veriban_settings" 
ON public.veriban_settings 
FOR SELECT 
TO authenticated
USING (
  company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  AND public.is_company_admin_or_owner(auth.uid(), company_id)
);

CREATE POLICY "Admin/Owner can insert veriban_settings" 
ON public.veriban_settings 
FOR INSERT 
TO authenticated
WITH CHECK (
  company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  AND public.is_company_admin_or_owner(auth.uid(), company_id)
);

CREATE POLICY "Admin/Owner can update veriban_settings" 
ON public.veriban_settings 
FOR UPDATE 
TO authenticated
USING (
  company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  AND public.is_company_admin_or_owner(auth.uid(), company_id)
)
WITH CHECK (
  company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  AND public.is_company_admin_or_owner(auth.uid(), company_id)
);

CREATE POLICY "Admin/Owner can delete veriban_settings" 
ON public.veriban_settings 
FOR DELETE 
TO authenticated
USING (
  company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
  AND public.is_company_admin_or_owner(auth.uid(), company_id)
);