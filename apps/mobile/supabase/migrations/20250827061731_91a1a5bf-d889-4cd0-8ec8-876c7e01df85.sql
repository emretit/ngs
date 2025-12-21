-- Fix multi-tenant setup - simplified approach
-- Step 1: Create user_prefs table if not exists
CREATE TABLE IF NOT EXISTS public.user_prefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  current_org_id uuid REFERENCES public.orgs(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(user_id)
);

-- Enable RLS on user_prefs
ALTER TABLE public.user_prefs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can manage their own preferences" ON public.user_prefs;

-- Create RLS policy for user_prefs
CREATE POLICY "Users can manage their own preferences" ON public.user_prefs
FOR ALL USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Step 2: Create org_members table if not exists
CREATE TABLE IF NOT EXISTS public.org_members (
  org_id uuid REFERENCES public.orgs(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL DEFAULT 'member',
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  company_id uuid REFERENCES public.companies(id),
  PRIMARY KEY (org_id, user_id)
);

-- Enable RLS on org_members
ALTER TABLE public.org_members ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can see their own org memberships" ON public.org_members;
DROP POLICY IF EXISTS "Org owners/admins can manage members" ON public.org_members;

-- Create RLS policies for org_members
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

-- Step 3: Update v_user_orgs view
DROP VIEW IF EXISTS public.v_user_orgs;
CREATE VIEW public.v_user_orgs AS
SELECT 
  om.user_id,
  om.org_id,
  o.name AS org_name,
  om.role
FROM public.org_members om
JOIN public.orgs o ON om.org_id = o.id;

-- Step 4: Create organizations and memberships for authenticated users
DO $$
DECLARE
  user_record RECORD;
  default_org_id uuid;
  org_name_val text;
BEGIN
  -- For each user in profiles that exists in auth.users
  FOR user_record IN 
    SELECT p.id, p.company_id, 
           COALESCE(p.company_name, p.full_name || ' Organization', 'Default Organization') as org_name
    FROM public.profiles p
    INNER JOIN auth.users au ON p.id = au.id
    WHERE p.id IS NOT NULL
  LOOP
    org_name_val := user_record.org_name;
    default_org_id := NULL;
    
    -- Check if user already has an org
    SELECT om.org_id INTO default_org_id 
    FROM public.org_members om 
    WHERE om.user_id = user_record.id 
    LIMIT 1;
    
    -- If no org membership exists, create org and membership
    IF default_org_id IS NULL THEN
      -- Try to find existing org by company_id
      IF user_record.company_id IS NOT NULL THEN
        SELECT id INTO default_org_id 
        FROM public.orgs 
        WHERE company_id = user_record.company_id 
        LIMIT 1;
      END IF;
      
      -- If no org found, create new one
      IF default_org_id IS NULL THEN
        INSERT INTO public.orgs (name, company_id)
        VALUES (org_name_val, user_record.company_id)
        RETURNING id INTO default_org_id;
      END IF;
      
      -- Create org membership as owner
      INSERT INTO public.org_members (org_id, user_id, role, company_id)
      VALUES (default_org_id, user_record.id, 'owner', user_record.company_id)
      ON CONFLICT (org_id, user_id) DO NOTHING;
    END IF;
    
    -- Create or update user preference
    INSERT INTO public.user_prefs (user_id, current_org_id)
    VALUES (user_record.id, default_org_id)
    ON CONFLICT (user_id) DO UPDATE SET current_org_id = default_org_id;
    
  END LOOP;
END;
$$;

-- Step 5: Create trigger for user_prefs updated_at
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