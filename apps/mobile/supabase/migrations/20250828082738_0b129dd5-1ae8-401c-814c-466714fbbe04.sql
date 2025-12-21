-- Phase 2 Continued: Add RLS policies for remaining tables

-- Add RLS policies for equipment table (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'equipment' AND policyname = 'Company-based access') THEN
        EXECUTE 'CREATE POLICY "Company-based access" ON public.equipment FOR ALL TO authenticated USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id())';
    END IF;
END $$;

-- Add RLS policies for events table (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'events' AND policyname = 'Company-based access') THEN
        EXECUTE 'CREATE POLICY "Company-based access" ON public.events FOR ALL TO authenticated USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id())';
    END IF;
END $$;

-- Add RLS policies for example_items table (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'example_items' AND policyname = 'Company-based access') THEN
        EXECUTE 'CREATE POLICY "Company-based access" ON public.example_items FOR ALL TO authenticated USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id())';
    END IF;
END $$;

-- Add RLS policies for exchange_rate_updates table (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'exchange_rate_updates' AND policyname = 'Company-based access') THEN
        EXECUTE 'CREATE POLICY "Company-based access" ON public.exchange_rate_updates FOR ALL TO authenticated USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id())';
    END IF;
END $$;

-- Add RLS policies for exchange_rates table (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'exchange_rates' AND policyname = 'Company-based access') THEN
        EXECUTE 'CREATE POLICY "Company-based access" ON public.exchange_rates FOR ALL TO authenticated USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id())';
    END IF;
END $$;

-- Add RLS policies for financial_instruments table (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'financial_instruments' AND policyname = 'Company-based access') THEN
        EXECUTE 'CREATE POLICY "Company-based access" ON public.financial_instruments FOR ALL TO authenticated USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id())';
    END IF;
END $$;

-- Add RLS policies for hr_budget table (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hr_budget' AND policyname = 'Company-based access') THEN
        EXECUTE 'CREATE POLICY "Company-based access" ON public.hr_budget FOR ALL TO authenticated USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id())';
    END IF;
END $$;

-- Add RLS policies for invoice_analysis table (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'invoice_analysis' AND policyname = 'Company-based access') THEN
        EXECUTE 'CREATE POLICY "Company-based access" ON public.invoice_analysis FOR ALL TO authenticated USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id())';
    END IF;
END $$;

-- Add RLS policies for loans table (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'loans' AND policyname = 'Company-based access') THEN
        EXECUTE 'CREATE POLICY "Company-based access" ON public.loans FOR ALL TO authenticated USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id())';
    END IF;
END $$;

-- Add RLS policies for monthly_financials table (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'monthly_financials' AND policyname = 'Company-based access') THEN
        EXECUTE 'CREATE POLICY "Company-based access" ON public.monthly_financials FOR ALL TO authenticated USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id())';
    END IF;
END $$;

-- Add RLS policies for n8n_workflow_logs table (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'n8n_workflow_logs' AND policyname = 'Company-based access') THEN
        EXECUTE 'CREATE POLICY "Company-based access" ON public.n8n_workflow_logs FOR ALL TO authenticated USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id())';
    END IF;
END $$;

-- Add RLS policies for nilvera_auth table (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'nilvera_auth' AND policyname = 'Company-based access') THEN
        EXECUTE 'CREATE POLICY "Company-based access" ON public.nilvera_auth FOR ALL TO authenticated USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id())';
    END IF;
END $$;

-- Add RLS policies for opex_matrix table (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'opex_matrix' AND policyname = 'Company-based access') THEN
        EXECUTE 'CREATE POLICY "Company-based access" ON public.opex_matrix FOR ALL TO authenticated USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id())';
    END IF;
END $$;

-- Add RLS policies for opportunity_kanban_columns table (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'opportunity_kanban_columns' AND policyname = 'Company-based access') THEN
        EXECUTE 'CREATE POLICY "Company-based access" ON public.opportunity_kanban_columns FOR ALL TO authenticated USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id())';
    END IF;
END $$;

-- Continue with more tables that likely need RLS policies
-- Check for tables like product_categories, products, proposals, etc.

-- Products related tables (company_id likely exists)
DO $$ 
BEGIN
    -- products table
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'company_id') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'Company-based access') THEN
            EXECUTE 'CREATE POLICY "Company-based access" ON public.products FOR ALL TO authenticated USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id())';
        END IF;
    END IF;
    
    -- product_categories table
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_categories' AND column_name = 'company_id') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'product_categories' AND policyname = 'Company-based access') THEN
            EXECUTE 'CREATE POLICY "Company-based access" ON public.product_categories FOR ALL TO authenticated USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id())';
        END IF;
    END IF;
    
    -- proposals table
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'proposals' AND column_name = 'company_id') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'proposals' AND policyname = 'Company-based access') THEN
            EXECUTE 'CREATE POLICY "Company-based access" ON public.proposals FOR ALL TO authenticated USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id())';
        END IF;
    END IF;
    
    -- proposal_terms table
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'proposal_terms' AND column_name = 'company_id') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'proposal_terms' AND policyname = 'Company-based access') THEN
            EXECUTE 'CREATE POLICY "Company-based access" ON public.proposal_terms FOR ALL TO authenticated USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id())';
        END IF;
    END IF;
    
    -- suppliers table
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'suppliers' AND column_name = 'company_id') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'suppliers' AND policyname = 'Company-based access') THEN
            EXECUTE 'CREATE POLICY "Company-based access" ON public.suppliers FOR ALL TO authenticated USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id())';
        END IF;
    END IF;
    
    -- payments table
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'company_id') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payments' AND policyname = 'Company-based access') THEN
            EXECUTE 'CREATE POLICY "Company-based access" ON public.payments FOR ALL TO authenticated USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id())';
        END IF;
    END IF;
    
    -- purchase_orders table
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'purchase_orders' AND column_name = 'company_id') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'purchase_orders' AND policyname = 'Company-based access') THEN
            EXECUTE 'CREATE POLICY "Company-based access" ON public.purchase_orders FOR ALL TO authenticated USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id())';
        END IF;
    END IF;
    
    -- purchase_order_items table
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'purchase_order_items' AND column_name = 'company_id') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'purchase_order_items' AND policyname = 'Company-based access') THEN
            EXECUTE 'CREATE POLICY "Company-based access" ON public.purchase_order_items FOR ALL TO authenticated USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id())';
        END IF;
    END IF;
    
    -- service_requests table
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'service_requests' AND column_name = 'company_id') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'service_requests' AND policyname = 'Company-based access') THEN
            EXECUTE 'CREATE POLICY "Company-based access" ON public.service_requests FOR ALL TO authenticated USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id())';
        END IF;
    END IF;
    
    -- service_activities table
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'service_activities' AND column_name = 'company_id') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'service_activities' AND policyname = 'Company-based access') THEN
            EXECUTE 'CREATE POLICY "Company-based access" ON public.service_activities FOR ALL TO authenticated USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id())';
        END IF;
    END IF;
    
    -- tasks table
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'company_id') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tasks' AND policyname = 'Company-based access') THEN
            EXECUTE 'CREATE POLICY "Company-based access" ON public.tasks FOR ALL TO authenticated USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id())';
        END IF;
    END IF;
    
    -- veriban_settings table
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'veriban_settings' AND column_name = 'company_id') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'veriban_settings' AND policyname = 'Company-based access') THEN
            EXECUTE 'CREATE POLICY "Company-based access" ON public.veriban_settings FOR ALL TO authenticated USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id())';
        END IF;
    END IF;
    
END $$;