-- Enable RLS on critical remaining tables and add policies
-- PostgreSQL doesn't support IF NOT EXISTS for policies, so we'll use proper syntax

-- Enable RLS on remaining tables
ALTER TABLE IF EXISTS companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS pdf_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payment_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS opportunity_kanban_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS opportunity_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS purchase_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS purchase_request_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS purchase_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS veriban_incoming_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS veriban_invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS veriban_operation_logs ENABLE ROW LEVEL SECURITY;

-- Add policies for tables that need company-based access (only if they don't exist)

-- pdf_templates policies  
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pdf_templates' AND policyname = 'Company-based access') THEN
    CREATE POLICY "Company-based access" ON pdf_templates 
    FOR ALL 
    TO authenticated 
    USING (company_id = current_company_id());
  END IF;
END $$;

-- payments policies
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payments' AND policyname = 'Company-based access') THEN
    CREATE POLICY "Company-based access" ON payments 
    FOR ALL 
    TO authenticated 
    USING (company_id = current_company_id());
  END IF;
END $$;

-- payment_notifications policies  
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payment_notifications' AND policyname = 'Company-based access') THEN
    CREATE POLICY "Company-based access" ON payment_notifications 
    FOR ALL 
    TO authenticated 
    USING (company_id = current_company_id());
  END IF;
END $$;

-- opportunities policy
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'opportunities' AND policyname = 'Company-based access') THEN
    CREATE POLICY "Company-based access" ON opportunities 
    FOR ALL 
    TO authenticated 
    USING (company_id = current_company_id());
  END IF;
END $$;

-- products policy
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'Company-based access') THEN
    CREATE POLICY "Company-based access" ON products 
    FOR ALL 
    TO authenticated 
    USING (company_id = current_company_id());
  END IF;
END $$;