-- Fix profiles table foreign key constraint and consolidate to single user system
-- First, update the foreign key to reference auth.users instead of public.users

-- Drop the existing foreign key constraint if it exists
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Add new foreign key constraint referencing auth.users
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_id_fkey 
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Ensure profiles table has all necessary columns
DO $$ 
BEGIN
  -- Add last_login column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='last_login') THEN
    ALTER TABLE public.profiles ADD COLUMN last_login timestamp with time zone;
  END IF;
END $$;

-- Drop users table if it exists (now safe to do)
DROP TABLE IF EXISTS public.users CASCADE;

-- Update AuthContext to use profiles table for last_login updates
-- This will be done in the code changes

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