-- Improve current_company_id() function with better error handling and logging
CREATE OR REPLACE FUNCTION public.current_company_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $function$
DECLARE
  user_company_id UUID;
  app_user_id UUID;
BEGIN
  -- Get current user ID
  app_user_id := auth.uid();
  
  -- If no authenticated user, return NULL
  IF app_user_id IS NULL THEN
    RAISE WARNING 'current_company_id(): No authenticated user (auth.uid() is NULL)';
    RETURN NULL;
  END IF;

  -- Fetch company_id from profiles table
  SELECT company_id INTO user_company_id
  FROM public.profiles 
  WHERE id = app_user_id;

  -- Check if user profile exists
  IF NOT FOUND THEN
    RAISE WARNING 'current_company_id(): User profile not found for user_id=%', app_user_id;
    RETURN NULL;
  END IF;

  -- Check if company_id is NULL in profile
  IF user_company_id IS NULL THEN
    RAISE WARNING 'current_company_id(): User profile exists but company_id is NULL for user_id=%', app_user_id;
    RETURN NULL;
  END IF;

  -- Return the company_id
  RETURN user_company_id;
  
EXCEPTION 
  WHEN OTHERS THEN
    RAISE WARNING 'current_company_id(): Exception occurred - SQLSTATE=%, SQLERRM=%', SQLSTATE, SQLERRM;
    RETURN NULL;
END;
$function$;

-- Add helpful comment
COMMENT ON FUNCTION public.current_company_id() IS 
'Returns the company_id for the current authenticated user from their profile. 
Returns NULL if user is not authenticated or has no company_id set.
Used by RLS policies for multi-tenant data isolation.';
