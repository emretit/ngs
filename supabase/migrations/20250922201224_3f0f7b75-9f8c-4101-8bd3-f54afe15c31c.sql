-- Enable RLS on remaining tables that don't have it enabled

-- Enable RLS on financial_instruments table
ALTER TABLE public.financial_instruments ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for financial_instruments table
CREATE POLICY "Company-based access" ON public.financial_instruments
FOR ALL USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- Enable RLS on notifications table if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notifications') THEN
        ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Company-based access" ON public.notifications
        FOR ALL USING (company_id = current_company_id())
        WITH CHECK (company_id = current_company_id());
    END IF;
END $$;

-- Enable RLS on organization_members table if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'organization_members') THEN
        ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Company-based access" ON public.organization_members
        FOR ALL USING (company_id = current_company_id())
        WITH CHECK (company_id = current_company_id());
    END IF;
END $$;

-- Enable RLS on profiles table if it exists and doesn't have RLS yet
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Enable RLS on purchase_requests table if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'purchase_requests') THEN
        ALTER TABLE public.purchase_requests ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Company-based access" ON public.purchase_requests
        FOR ALL USING (company_id = current_company_id())
        WITH CHECK (company_id = current_company_id());
    END IF;
END $$;