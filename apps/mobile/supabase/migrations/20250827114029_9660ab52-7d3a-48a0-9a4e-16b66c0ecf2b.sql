-- Drop the users table and consolidate everything to profiles table
-- First update handle_new_user function to work with profiles table only

DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Create improved handle_new_user function for profiles table
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
    (NEW.email || ' Company')
  );
  
  -- Create company first
  INSERT INTO public.companies (name, email, is_active)
  VALUES (_company_name, NEW.email, true)
  RETURNING id INTO _company_id;
  
  -- Insert into profiles with company_id and all needed fields
  INSERT INTO public.profiles (
    id, 
    full_name, 
    company_name,
    company_id,
    email,
    is_active,
    last_login,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    _company_name,
    _company_id,
    NEW.email,
    true,
    now(),
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    company_name = EXCLUDED.company_name,
    company_id = EXCLUDED.company_id,
    email = EXCLUDED.email,
    last_login = now(),
    updated_at = now();
    
  RETURN NEW;
END;
$function$;

-- Ensure the trigger exists for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add missing columns to profiles table if they don't exist
DO $$ 
BEGIN
  -- Add last_login column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='last_login') THEN
    ALTER TABLE public.profiles ADD COLUMN last_login timestamp with time zone;
  END IF;
END $$;

-- Update current_user_id function to use profiles table
CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  RETURN auth.uid();
END;
$function$;

-- Update current_company_id function to use profiles table
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

  -- Use profiles table instead of users table
  SELECT company_id INTO user_company_id
  FROM public.profiles 
  WHERE id = app_user_id;

  RETURN user_company_id;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$function$;

-- Drop users table if it exists (after migrating any needed data)
-- First check if users table exists and has data that needs to be migrated to profiles
DO $$
DECLARE
  users_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'users'
  ) INTO users_exists;
  
  IF users_exists THEN
    -- Migrate any missing data from users to profiles
    INSERT INTO public.profiles (
      id, full_name, email, company_id, last_login, created_at, updated_at, is_active
    )
    SELECT 
      u.id, 
      u.full_name, 
      u.email, 
      u.company_id, 
      u.last_login,
      u.created_at,
      u.updated_at,
      u.is_active
    FROM public.users u
    WHERE NOT EXISTS (
      SELECT 1 FROM public.profiles p WHERE p.id = u.id
    );
    
    -- Now drop the users table
    DROP TABLE IF EXISTS public.users CASCADE;
  END IF;
END $$;