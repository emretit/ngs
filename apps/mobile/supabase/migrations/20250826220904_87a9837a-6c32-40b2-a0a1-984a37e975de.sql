-- Step 1: Update profiles table structure (if columns don't exist)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id),
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS avatar_url text,
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Step 2: Update handle_new_user trigger to create company and set up profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
AS $$
DECLARE
  _company_id uuid;
  _company_name text;
BEGIN
  -- Get company name from user metadata or use email-based default
  _company_name := COALESCE(
    NEW.raw_user_meta_data ->> 'company_name',
    NEW.raw_user_meta_data ->> 'company_id',
    (NEW.email || ' Company')
  );
  
  -- Create company first
  INSERT INTO public.companies (name, email, is_active)
  VALUES (_company_name, NEW.email, true)
  RETURNING id INTO _company_id;
  
  -- Insert into profiles with company_id
  INSERT INTO public.profiles (
    id, 
    full_name, 
    company_name,
    company_id,
    email,
    is_active
  )
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    _company_name,
    _company_id,
    NEW.email,
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    company_name = EXCLUDED.company_name,
    company_id = EXCLUDED.company_id,
    email = EXCLUDED.email,
    updated_at = now();
    
  RETURN NEW;
END;
$$;

-- Step 3: Update assign_admin_role trigger
CREATE OR REPLACE FUNCTION public.assign_admin_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only assign admin role if user_roles table exists
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_roles' AND table_schema = 'public') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Step 4: Populate missing company_id values in profiles
UPDATE public.profiles 
SET company_id = (
  SELECT id FROM public.companies 
  WHERE companies.name LIKE (profiles.company_name || '%')
  OR companies.email = profiles.email
  LIMIT 1
)
WHERE company_id IS NULL;

-- Create companies for profiles without one
INSERT INTO public.companies (name, email, is_active)
SELECT 
  COALESCE(full_name, email, 'Unknown') || ' Company',
  COALESCE(email, 'noemail@company.com'),
  true
FROM public.profiles 
WHERE company_id IS NULL
ON CONFLICT DO NOTHING;

-- Update remaining profiles
UPDATE public.profiles 
SET company_id = (
  SELECT id FROM public.companies 
  WHERE companies.email = COALESCE(profiles.email, 'noemail@company.com')
  LIMIT 1
)
WHERE company_id IS NULL;