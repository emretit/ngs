-- Create Veriban authentication table
CREATE TABLE IF NOT EXISTS public.veriban_auth (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Veriban SOAP Credentials
    username text NOT NULL,
    password text NOT NULL,
    
    -- Test/Production environment
    test_mode boolean DEFAULT true,
    webservice_url text NOT NULL,
    
    -- Status
    is_active boolean DEFAULT true,
    last_login timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    
    UNIQUE(company_id)
);

-- Enable RLS on veriban_auth
ALTER TABLE public.veriban_auth ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for veriban_auth
DROP POLICY IF EXISTS "Company-based access" ON public.veriban_auth;
CREATE POLICY "Company-based access" ON public.veriban_auth 
FOR ALL 
TO authenticated 
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- Create updated_at trigger for veriban_auth
DROP TRIGGER IF EXISTS update_veriban_auth_updated_at ON public.veriban_auth;
CREATE TRIGGER update_veriban_auth_updated_at
    BEFORE UPDATE ON public.veriban_auth
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Update integrator_settings constraint to include 'veriban'
ALTER TABLE public.integrator_settings 
DROP CONSTRAINT IF EXISTS integrator_settings_selected_integrator_check;

ALTER TABLE public.integrator_settings 
ADD CONSTRAINT integrator_settings_selected_integrator_check 
CHECK (selected_integrator IN ('nilvera', 'elogo', 'veriban'));

-- Add comments for documentation
COMMENT ON TABLE public.veriban_auth IS 'Veriban SOAP webservice authentication credentials';
COMMENT ON COLUMN public.integrator_settings.selected_integrator IS 'Active e-invoice integrator: nilvera, elogo, or veriban';

