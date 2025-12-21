-- Fix handle_new_user function to always assign roles with proper company_id
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  _company_id uuid;
  _company_name text;
  _invited_by_company_id uuid;
  _default_role user_role := 'admin';
BEGIN
  -- Check if user was invited to an existing company
  _invited_by_company_id := (NEW.raw_user_meta_data ->> 'invited_by_company_id')::uuid;
  
  IF _invited_by_company_id IS NOT NULL THEN
    -- User was invited, use the existing company
    _company_id := _invited_by_company_id;
    _company_name := NEW.raw_user_meta_data ->> 'company_name';
    _default_role := 'admin';
  ELSE
    -- Regular signup, create new company
    _company_name := COALESCE(
      NEW.raw_user_meta_data ->> 'company_name',
      NEW.raw_user_meta_data ->> 'company_id',
      (NEW.email || ' Company')
    );
    
    -- Create company first
    INSERT INTO public.companies (name, email, is_active)
    VALUES (_company_name, NEW.email, true)
    RETURNING id INTO _company_id;
    
    _default_role := 'owner';
  END IF;
  
  -- Ensure we have a valid company_id
  IF _company_id IS NULL THEN
    RAISE EXCEPTION 'Company ID cannot be null for user %', NEW.id;
  END IF;
  
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

  -- Always assign a role to the user
  INSERT INTO public.user_roles (user_id, role, company_id)
  VALUES (NEW.id, _default_role, _company_id)
  ON CONFLICT (user_id, role, company_id) DO NOTHING;
    
  RETURN NEW;
END;
$$;