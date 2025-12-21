-- Manual setup for current authenticated user
-- Step 1: Ensure tables exist with proper structure
CREATE TABLE IF NOT EXISTS public.user_prefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  current_org_id uuid REFERENCES public.orgs(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS public.org_members (
  org_id uuid REFERENCES public.orgs(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL DEFAULT 'member',
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  company_id uuid REFERENCES public.companies(id),
  PRIMARY KEY (org_id, user_id)
);

-- Enable RLS
ALTER TABLE public.user_prefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_members ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies
DROP POLICY IF EXISTS "Users can manage their own preferences" ON public.user_prefs;
CREATE POLICY "Users can manage their own preferences" ON public.user_prefs
FOR ALL USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can see their own org memberships" ON public.org_members;
DROP POLICY IF EXISTS "Org owners/admins can manage members" ON public.org_members;

CREATE POLICY "Users can see their own org memberships" ON public.org_members
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Org owners/admins can manage members" ON public.org_members
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.org_members om
    WHERE om.org_id = org_members.org_id 
    AND om.user_id = auth.uid() 
    AND om.role IN ('owner', 'admin')
  )
);

-- Create v_user_orgs view
DROP VIEW IF EXISTS public.v_user_orgs;
CREATE VIEW public.v_user_orgs AS
SELECT 
  om.user_id,
  om.org_id,
  o.name AS org_name,
  om.role
FROM public.org_members om
JOIN public.orgs o ON om.org_id = o.id;

-- Step 2: Create org and membership for the specific user we know exists
DO $$
DECLARE
  current_user_id uuid := 'eacc3cf1-b059-4578-bbac-f1429b3a10d0';
  user_company_id uuid;
  user_org_name text;
  new_org_id uuid;
BEGIN
  -- Get user's company info
  SELECT company_id, COALESCE(company_name, full_name || ' Organization', 'NGS Organization') 
  INTO user_company_id, user_org_name
  FROM public.profiles 
  WHERE id = current_user_id;
  
  -- Only proceed if the profile exists
  IF user_org_name IS NOT NULL THEN
    -- Try to find existing org by company_id
    IF user_company_id IS NOT NULL THEN
      SELECT id INTO new_org_id 
      FROM public.orgs 
      WHERE company_id = user_company_id 
      LIMIT 1;
    END IF;
    
    -- If no org found, create new one
    IF new_org_id IS NULL THEN
      INSERT INTO public.orgs (name, company_id)
      VALUES (user_org_name, user_company_id)
      RETURNING id INTO new_org_id;
    END IF;
    
    -- Create org membership as owner
    INSERT INTO public.org_members (org_id, user_id, role, company_id)
    VALUES (new_org_id, current_user_id, 'owner', user_company_id)
    ON CONFLICT (org_id, user_id) DO NOTHING;
    
    -- Create user preference
    INSERT INTO public.user_prefs (user_id, current_org_id)
    VALUES (current_user_id, new_org_id)
    ON CONFLICT (user_id) DO UPDATE SET current_org_id = new_org_id;
    
  END IF;
END;
$$;

-- Step 3: Create updated_at trigger
CREATE OR REPLACE FUNCTION public.update_user_prefs_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_user_prefs_updated_at ON public.user_prefs;
CREATE TRIGGER update_user_prefs_updated_at
  BEFORE UPDATE ON public.user_prefs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_prefs_updated_at();