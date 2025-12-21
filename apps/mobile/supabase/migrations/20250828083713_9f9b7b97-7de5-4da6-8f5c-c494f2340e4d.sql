-- Phase 3: Fix function search path security issues
-- Set search_path for security-critical functions to prevent injection attacks

-- Fix current_company_id function
CREATE OR REPLACE FUNCTION public.current_company_id()
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, pg_temp
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

-- Fix current_user_id function
CREATE OR REPLACE FUNCTION public.current_user_id()
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, pg_temp
AS $function$
BEGIN
  RETURN auth.uid();
END;
$function$;

-- Fix set_company_id_on_insert function
CREATE OR REPLACE FUNCTION public.set_company_id_on_insert()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public, pg_temp
AS $function$
BEGIN
  IF NEW.company_id IS NULL THEN
    NEW.company_id = current_company_id();
  END IF;
  RETURN NEW;
END;
$function$;

-- Fix handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, pg_temp
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

-- Fix update_updated_at function
CREATE OR REPLACE FUNCTION public.update_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public, pg_temp
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;