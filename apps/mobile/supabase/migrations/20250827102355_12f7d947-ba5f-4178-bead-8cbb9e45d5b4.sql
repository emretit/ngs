-- Enable RLS on remaining tables that are missing it
-- Get list of tables without RLS and enable it

-- Enable RLS on ALL remaining public tables for complete security
ALTER TABLE IF EXISTS pdf_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payment_notifications ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for the newly enabled tables where they're missing
-- These tables need company-based access policies

-- pdf_templates policies  
CREATE POLICY IF NOT EXISTS "Company-based access" ON pdf_templates 
FOR ALL 
TO authenticated 
USING (company_id = current_company_id());

-- payments policies
CREATE POLICY IF NOT EXISTS "Company-based access" ON payments 
FOR ALL 
TO authenticated 
USING (company_id = current_company_id());

-- payment_notifications policies  
CREATE POLICY IF NOT EXISTS "Company-based access" ON payment_notifications 
FOR ALL 
TO authenticated 
USING (company_id = current_company_id());

-- Also add policies for any tables that have RLS enabled but no policies
-- opportunities policy
CREATE POLICY IF NOT EXISTS "Company-based access" ON opportunities 
FOR ALL 
TO authenticated 
USING (company_id = current_company_id());

-- products policy
CREATE POLICY IF NOT EXISTS "Company-based access" ON products 
FOR ALL 
TO authenticated 
USING (company_id = current_company_id());

-- product_categories policy
CREATE POLICY IF NOT EXISTS "Company-based access" ON product_categories 
FOR ALL 
TO authenticated 
USING (company_id = current_company_id());