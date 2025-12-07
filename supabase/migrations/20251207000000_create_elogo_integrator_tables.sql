-- Create e-Logo authentication table
CREATE TABLE IF NOT EXISTS public.elogo_auth (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
    
    -- e-Logo SOAP Credentials
    username text NOT NULL,
    password text NOT NULL,
    
    -- Test/Production environment
    test_mode boolean DEFAULT true,
    webservice_url text, -- SOAP endpoint URL
    
    -- Status
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    
    UNIQUE(company_id)
);

-- Create integrator settings table
CREATE TABLE IF NOT EXISTS public.integrator_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Selected integrator: 'nilvera' or 'elogo'
    selected_integrator text NOT NULL DEFAULT 'nilvera',
    
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    
    UNIQUE(company_id),
    CHECK (selected_integrator IN ('nilvera', 'elogo'))
);

-- Enable RLS on elogo_auth
ALTER TABLE public.elogo_auth ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for elogo_auth
DROP POLICY IF EXISTS "Company-based access" ON public.elogo_auth;
CREATE POLICY "Company-based access" ON public.elogo_auth 
FOR ALL 
TO authenticated 
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- Enable RLS on integrator_settings
ALTER TABLE public.integrator_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for integrator_settings
DROP POLICY IF EXISTS "Company-based access" ON public.integrator_settings;
CREATE POLICY "Company-based access" ON public.integrator_settings 
FOR ALL 
TO authenticated 
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_elogo_auth_updated_at ON public.elogo_auth;
CREATE TRIGGER update_elogo_auth_updated_at
BEFORE UPDATE ON public.elogo_auth
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_integrator_settings_updated_at ON public.integrator_settings;
CREATE TRIGGER update_integrator_settings_updated_at
BEFORE UPDATE ON public.integrator_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE public.elogo_auth IS 'e-Logo SOAP webservice authentication credentials';
COMMENT ON TABLE public.integrator_settings IS 'Company integrator selection (Nilvera or e-Logo)';
COMMENT ON COLUMN public.integrator_settings.selected_integrator IS 'Active e-invoice integrator: nilvera or elogo';
