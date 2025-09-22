-- Fix the current_company_id function to be more robust
CREATE OR REPLACE FUNCTION public.current_company_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  user_company_id UUID;
  app_user_id UUID;
BEGIN
  -- Get the authenticated user ID
  app_user_id := auth.uid();
  
  -- If no authenticated user, return NULL
  IF app_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Get company_id from profiles table
  SELECT company_id INTO user_company_id
  FROM public.profiles 
  WHERE id = app_user_id
  LIMIT 1;

  -- If user has no profile or company_id, try to get from auth metadata
  IF user_company_id IS NULL THEN
    SELECT (auth.jwt() ->> 'user_metadata')::jsonb ->> 'company_id' INTO user_company_id;
    
    -- Try to parse as UUID if it's a string
    IF user_company_id IS NOT NULL THEN
      BEGIN
        user_company_id := user_company_id::uuid;
      EXCEPTION WHEN invalid_text_representation THEN
        user_company_id := NULL;
      END;
    END IF;
  END IF;

  RETURN user_company_id;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$function$;

-- Create a function to get company context safely for frontend
CREATE OR REPLACE FUNCTION public.get_user_company_context()
RETURNS TABLE(user_id uuid, company_id uuid, company_name text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    auth.uid() as user_id,
    p.company_id,
    c.name as company_name
  FROM public.profiles p
  LEFT JOIN public.companies c ON c.id = p.company_id
  WHERE p.id = auth.uid();
END;
$function$;

-- Update the employees RLS policy to be more explicit
DROP POLICY IF EXISTS "Company-based access" ON public.employees;

CREATE POLICY "Company employees access"
ON public.employees
FOR ALL
TO authenticated
USING (
  company_id = current_company_id()
  OR 
  -- Fallback: allow access if user belongs to the company via profiles
  company_id IN (
    SELECT p.company_id 
    FROM public.profiles p 
    WHERE p.id = auth.uid() 
    AND p.company_id IS NOT NULL
  )
)
WITH CHECK (
  company_id = current_company_id()
  OR 
  company_id IN (
    SELECT p.company_id 
    FROM public.profiles p 
    WHERE p.id = auth.uid() 
    AND p.company_id IS NOT NULL
  )
);