-- Fix multi-tenant setup with proper data cleanup
-- Step 1: Clean up orphaned profiles first
DELETE FROM public.profiles 
WHERE id NOT IN (SELECT id FROM auth.users);

-- Step 2: Create or update user_prefs table
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

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can manage their own preferences" ON public.user_prefs;

-- Create RLS policies for user_prefs
CREATE POLICY "Users can manage their own preferences" ON public.user_prefs
FOR ALL USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Step 3: Ensure org_members table has correct structure
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

-- Drop existing policies if they exist
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

-- Step 4: Update v_user_orgs view to match OrgSwitcher expectations
DROP VIEW IF EXISTS public.v_user_orgs;
CREATE VIEW public.v_user_orgs AS
SELECT 
  om.user_id,
  om.org_id,
  o.name AS org_name,
  om.role
FROM public.org_members om
JOIN public.orgs o ON om.org_id = o.id;

-- Step 5: Create default organizations for existing authenticated users only
DO $$
DECLARE
  user_record RECORD;
  default_org_id uuid;
  org_name_val text;
BEGIN
  -- For each user in profiles that exists in auth.users, create an org and membership
  FOR user_record IN 
    SELECT DISTINCT p.id, p.company_id, 
           COALESCE(p.company_name, p.full_name || ' Org', 'Default Org') as org_name
    FROM public.profiles p
    INNER JOIN auth.users au ON p.id = au.id
    WHERE p.id IS NOT NULL
  LOOP
    org_name_val := user_record.org_name;
    
    -- Create org from company or default
    IF user_record.company_id IS NOT NULL THEN
      -- Try to use existing company info to create org
      INSERT INTO public.orgs (name, company_id)
      SELECT name, id FROM public.companies WHERE id = user_record.company_id
      ON CONFLICT (name) DO NOTHING
      RETURNING id INTO default_org_id;
      
      -- Get the org id if insert was skipped due to conflict
      IF default_org_id IS NULL THEN
        SELECT id INTO default_org_id 
        FROM public.orgs 
        WHERE company_id = user_record.company_id 
        LIMIT 1;
      END IF;
    END IF;
    
    -- If still no org, create a default one
    IF default_org_id IS NULL THEN
      INSERT INTO public.orgs (name)
      VALUES (org_name_val)
      ON CONFLICT (name) DO NOTHING
      RETURNING id INTO default_org_id;
      
      -- Get the org id if insert was skipped due to conflict
      IF default_org_id IS NULL THEN
        SELECT id INTO default_org_id 
        FROM public.orgs 
        WHERE name = org_name_val 
        LIMIT 1;
      END IF;
    END IF;
    
    -- Create org membership as owner
    INSERT INTO public.org_members (org_id, user_id, role, company_id)
    VALUES (default_org_id, user_record.id, 'owner', user_record.company_id)
    ON CONFLICT (org_id, user_id) DO NOTHING;
    
    -- Create user preference
    INSERT INTO public.user_prefs (user_id, current_org_id)
    VALUES (user_record.id, default_org_id)
    ON CONFLICT (user_id) DO UPDATE SET current_org_id = default_org_id;
    
  END LOOP;
END;
$$;

-- Step 6: Add updated_at trigger for user_prefs
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