-- Step 1: Update profiles table structure
-- Make company_id NOT NULL and add missing columns
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id),
ADD COLUMN IF NOT EXISTS full_name text,
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
    NEW.raw_user_meta_data ->> 'company_id', -- if company_id is passed as string
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

-- Step 3: Update assign_admin_role trigger to automatically assign admin role
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

-- Step 4: Create user_roles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for user_roles
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Step 5: Make sure company_id is NOT NULL in profiles (after populating data)
-- First populate any missing company_id values
UPDATE public.profiles 
SET company_id = (
  SELECT id FROM public.companies 
  WHERE companies.name LIKE (profiles.company_name || '%')
  OR companies.email = profiles.email
  LIMIT 1
)
WHERE company_id IS NULL;

-- If still null, create a default company
INSERT INTO public.companies (name, email, is_active)
SELECT 
  COALESCE(full_name, email) || ' Company',
  email,
  true
FROM public.profiles 
WHERE company_id IS NULL
ON CONFLICT DO NOTHING;

-- Update profiles with the new companies
UPDATE public.profiles 
SET company_id = (
  SELECT id FROM public.companies 
  WHERE companies.email = profiles.email
  LIMIT 1
)
WHERE company_id IS NULL;

-- Now make company_id NOT NULL
ALTER TABLE public.profiles 
ALTER COLUMN company_id SET NOT NULL;

-- Step 6: Update current_company_id function to use profiles table
CREATE OR REPLACE FUNCTION public.current_company_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  user_company_id UUID;
  app_user_id UUID;
BEGIN
  app_user_id := auth.uid();
  IF app_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Use profiles table
  SELECT company_id INTO user_company_id
  FROM public.profiles 
  WHERE id = app_user_id;

  RETURN user_company_id;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$function$;