-- Phase 2: Complete RLS policies for tables missing them (updated approach)

-- Drop and recreate policies that might conflict, or create only if they don't exist

-- Add RLS policies for audit_logs table (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'audit_logs' AND policyname = 'Company-based access') THEN
        EXECUTE 'CREATE POLICY "Company-based access" ON public.audit_logs FOR ALL TO authenticated USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id())';
    END IF;
END $$;

-- Add RLS policies for bank_accounts table (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bank_accounts' AND policyname = 'Company-based access') THEN
        EXECUTE 'CREATE POLICY "Company-based access" ON public.bank_accounts FOR ALL TO authenticated USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id())';
    END IF;
END $$;

-- Add RLS policies for bank_transactions table (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bank_transactions' AND policyname = 'Company-based access') THEN
        EXECUTE 'CREATE POLICY "Company-based access" ON public.bank_transactions FOR ALL TO authenticated USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id())';
    END IF;
END $$;

-- Add RLS policies for card_transactions table (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'card_transactions' AND policyname = 'Company-based access') THEN
        EXECUTE 'CREATE POLICY "Company-based access" ON public.card_transactions FOR ALL TO authenticated USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id())';
    END IF;
END $$;

-- Add RLS policies for cash_flow_forecasts table (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cash_flow_forecasts' AND policyname = 'Company-based access') THEN
        EXECUTE 'CREATE POLICY "Company-based access" ON public.cash_flow_forecasts FOR ALL TO authenticated USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id())';
    END IF;
END $$;

-- Add RLS policies for cashflow_categories table (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cashflow_categories' AND policyname = 'Company-based access') THEN
        EXECUTE 'CREATE POLICY "Company-based access" ON public.cashflow_categories FOR ALL TO authenticated USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id())';
    END IF;
END $$;

-- Add RLS policies for cashflow_main table (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cashflow_main' AND policyname = 'Company-based access') THEN
        EXECUTE 'CREATE POLICY "Company-based access" ON public.cashflow_main FOR ALL TO authenticated USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id())';
    END IF;
END $$;

-- Add RLS policies for cashflow_transactions table (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cashflow_transactions' AND policyname = 'Company-based access') THEN
        EXECUTE 'CREATE POLICY "Company-based access" ON public.cashflow_transactions FOR ALL TO authenticated USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id())';
    END IF;
END $$;

-- Add RLS policies for e_fatura_stok_eslestirme table (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'e_fatura_stok_eslestirme' AND policyname = 'Company-based access') THEN
        EXECUTE 'CREATE POLICY "Company-based access" ON public.e_fatura_stok_eslestirme FOR ALL TO authenticated USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id())';
    END IF;
END $$;

-- Add RLS policies for einvoice_items table (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'einvoice_items' AND policyname = 'Company-based access') THEN
        EXECUTE 'CREATE POLICY "Company-based access" ON public.einvoice_items FOR ALL TO authenticated USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id())';
    END IF;
END $$;

-- Add RLS policies for einvoice_logs table (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'einvoice_logs' AND policyname = 'Company-based access') THEN
        EXECUTE 'CREATE POLICY "Company-based access" ON public.einvoice_logs FOR ALL TO authenticated USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id())';
    END IF;
END $$;

-- Add RLS policies for einvoices table (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'einvoices' AND policyname = 'Company-based access') THEN
        EXECUTE 'CREATE POLICY "Company-based access" ON public.einvoices FOR ALL TO authenticated USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id())';
    END IF;
END $$;

-- Add RLS policies for einvoices_received table (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'einvoices_received' AND policyname = 'Company-based access') THEN
        EXECUTE 'CREATE POLICY "Company-based access" ON public.einvoices_received FOR ALL TO authenticated USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id())';
    END IF;
END $$;

-- Add RLS policies for einvoices_sent table (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'einvoices_sent' AND policyname = 'Company-based access') THEN
        EXECUTE 'CREATE POLICY "Company-based access" ON public.einvoices_sent FOR ALL TO authenticated USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id())';
    END IF;
END $$;

-- Add RLS policies for employee_auth table (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'employee_auth' AND policyname = 'Company-based access') THEN
        EXECUTE 'CREATE POLICY "Company-based access" ON public.employee_auth FOR ALL TO authenticated USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id())';
    END IF;
END $$;

-- Add RLS policies for employee_documents table (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'employee_documents' AND policyname = 'Company-based access') THEN
        EXECUTE 'CREATE POLICY "Company-based access" ON public.employee_documents FOR ALL TO authenticated USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id())';
    END IF;
END $$;

-- Add RLS policies for employee_leaves table (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'employee_leaves' AND policyname = 'Company-based access') THEN
        EXECUTE 'CREATE POLICY "Company-based access" ON public.employee_leaves FOR ALL TO authenticated USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id())';
    END IF;
END $$;

-- Add RLS policies for employee_performance table (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'employee_performance' AND policyname = 'Company-based access') THEN
        EXECUTE 'CREATE POLICY "Company-based access" ON public.employee_performance FOR ALL TO authenticated USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id())';
    END IF;
END $$;

-- Add RLS policies for employee_salaries table (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'employee_salaries' AND policyname = 'Company-based access') THEN
        EXECUTE 'CREATE POLICY "Company-based access" ON public.employee_salaries FOR ALL TO authenticated USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id())';
    END IF;
END $$;

-- Add RLS policies for employees table (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'employees' AND policyname = 'Company-based access') THEN
        EXECUTE 'CREATE POLICY "Company-based access" ON public.employees FOR ALL TO authenticated USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id())';
    END IF;
END $$;