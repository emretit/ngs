-- Phase 1: Fix profiles table structure for proper multitenant support

-- First, update any profiles that might have NULL company_id
-- Create a default company for orphaned profiles if needed
DO $$
DECLARE
    default_company_id uuid;
BEGIN
    -- Check if there are any profiles without company_id
    IF EXISTS (SELECT 1 FROM profiles WHERE company_id IS NULL) THEN
        -- Create a default company for orphaned profiles
        INSERT INTO companies (name, email, is_active)
        VALUES ('Default Company', 'admin@defaultcompany.com', true)
        RETURNING id INTO default_company_id;
        
        -- Update orphaned profiles to use the default company
        UPDATE profiles 
        SET company_id = default_company_id 
        WHERE company_id IS NULL;
    END IF;
END $$;

-- Add company_name column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS company_name text;

-- Add is_active column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Update company_name from companies table for existing records
UPDATE public.profiles 
SET company_name = companies.name
FROM companies 
WHERE profiles.company_id = companies.id 
AND profiles.company_name IS NULL;

-- Make company_id NOT NULL (after ensuring all records have a company_id)
ALTER TABLE public.profiles 
ALTER COLUMN company_id SET NOT NULL;

-- Add foreign key constraint to companies table
ALTER TABLE public.profiles 
ADD CONSTRAINT fk_profiles_company_id 
FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE RESTRICT;

-- Update the handle_new_user function to work with the new structure
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
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
  
  -- Insert into profiles with company_id and company_name
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
    is_active = EXCLUDED.is_active,
    updated_at = now();
    
  RETURN NEW;
END;
$function$;

-- Ensure RLS is enabled on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and create new ones
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Create comprehensive RLS policies for profiles table
CREATE POLICY "Users can view profiles from their company" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (company_id = current_company_id());

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (id = auth.uid() AND company_id = current_company_id())
WITH CHECK (id = auth.uid() AND company_id = current_company_id());

CREATE POLICY "Users can insert their own profile during signup" 
ON public.profiles 
FOR INSERT 
TO authenticated
WITH CHECK (id = auth.uid());

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_company_id ON public.profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Update current_company_id function to be more robust
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

  -- Get company_id from profiles table
  SELECT company_id INTO user_company_id
  FROM public.profiles 
  WHERE id = app_user_id;

  RETURN user_company_id;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$function$;