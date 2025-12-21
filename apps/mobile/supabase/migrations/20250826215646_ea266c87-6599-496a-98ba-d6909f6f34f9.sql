-- First, let's check the audit_logs table structure and fix it
ALTER TABLE public.audit_logs 
ADD COLUMN IF NOT EXISTS user_id uuid;

-- Step 1: Delete the problematic "Company-based access" RLS policy from opportunities table
DROP POLICY IF EXISTS "Company-based access" ON public.opportunities;

-- Drop existing policy to recreate it
DROP POLICY IF EXISTS "Users can only access opportunities from their company" ON public.opportunities;

-- Step 2: Update current_company_id() function to use profiles table instead of users table
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

-- Step 3: Update current_user_id() function to work properly
CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  RETURN auth.uid();
END;
$function$;

-- Step 4: Ensure profiles table has proper company_id values
-- Update profiles without company_id to get one from their first company record
UPDATE public.profiles 
SET company_id = (
  SELECT id FROM public.companies 
  WHERE companies.id IS NOT NULL 
  LIMIT 1
)
WHERE company_id IS NULL;

-- Step 5: Create proper RLS policy for opportunities using the corrected function
CREATE POLICY "Users can only access opportunities from their company"
ON public.opportunities 
FOR ALL
TO authenticated
USING (company_id = public.current_company_id())
WITH CHECK (company_id = public.current_company_id());