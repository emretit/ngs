-- Final RLS enablement for the remaining tables without RLS
-- Complete the multi-tenant security setup

-- Enable RLS on the final set of tables
ALTER TABLE IF EXISTS n8n_workflow_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS orgs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_sessions ENABLE ROW LEVEL SECURITY;

-- Add basic policies for these tables (where company_id exists)
-- user_sessions should be user-specific, not company-specific
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_sessions' AND policyname = 'Users can access their own sessions') THEN
    CREATE POLICY "Users can access their own sessions" ON user_sessions 
    FOR ALL 
    TO authenticated 
    USING (user_id = auth.uid());
  END IF;
END $$;

-- user_profiles should be user-specific
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'Users can access their own profile') THEN
    CREATE POLICY "Users can access their own profile" ON user_profiles 
    FOR ALL 
    TO authenticated 
    USING (user_id = auth.uid());
  END IF;
END $$;

-- roles might be shared across system
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'roles' AND policyname = 'Authenticated users can view roles') THEN
    CREATE POLICY "Authenticated users can view roles" ON roles 
    FOR SELECT 
    TO authenticated 
    USING (true);
  END IF;
END $$;