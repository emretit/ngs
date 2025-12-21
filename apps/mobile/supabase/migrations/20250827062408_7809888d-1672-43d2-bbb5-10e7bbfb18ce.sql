-- Drop existing problematic tables and recreate properly
DROP TABLE IF EXISTS public.org_members CASCADE;
DROP TABLE IF EXISTS public.user_prefs CASCADE;

-- Create user_prefs table without foreign key constraints
CREATE TABLE public.user_prefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  current_org_id uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(user_id)
);

-- Create org_members table without foreign key constraints
CREATE TABLE public.org_members (
  org_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member',
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  company_id uuid,
  PRIMARY KEY (org_id, user_id)
);

-- Enable RLS
ALTER TABLE public.user_prefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_members ENABLE ROW LEVEL SECURITY;

-- Create RLS policies using string comparison to avoid auth.uid() type issues
CREATE POLICY "Users can manage their own preferences" ON public.user_prefs
FOR ALL USING (user_id::text = auth.uid()::text)
WITH CHECK (user_id::text = auth.uid()::text);

CREATE POLICY "Users can see their own org memberships" ON public.org_members
FOR SELECT USING (user_id::text = auth.uid()::text);

CREATE POLICY "Org owners/admins can manage members" ON public.org_members
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.org_members om
    WHERE om.org_id = org_members.org_id 
    AND om.user_id::text = auth.uid()::text 
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

-- Create organization and membership for current user
DO $$
DECLARE
  current_user_id uuid := 'eacc3cf1-b059-4578-bbac-f1429b3a10d0';
  user_company_id uuid;
  user_org_name text := 'Ngs Teknoloji Organization';
  new_org_id uuid;
BEGIN
  -- Get user's company info if exists
  SELECT company_id INTO user_company_id
  FROM public.profiles 
  WHERE id = current_user_id;
  
  -- Create or find organization
  SELECT id INTO new_org_id 
  FROM public.orgs 
  WHERE name = user_org_name 
  LIMIT 1;
  
  IF new_org_id IS NULL THEN
    INSERT INTO public.orgs (name, company_id)
    VALUES (user_org_name, user_company_id)
    RETURNING id INTO new_org_id;
  END IF;
  
  -- Create org membership
  INSERT INTO public.org_members (org_id, user_id, role, company_id)
  VALUES (new_org_id, current_user_id, 'owner', user_company_id)
  ON CONFLICT (org_id, user_id) DO NOTHING;
  
  -- Create user preference
  INSERT INTO public.user_prefs (user_id, current_org_id)
  VALUES (current_user_id, new_org_id)
  ON CONFLICT (user_id) DO UPDATE SET current_org_id = new_org_id;
  
END;
$$;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.update_user_prefs_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_user_prefs_updated_at
  BEFORE UPDATE ON public.user_prefs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_prefs_updated_at();