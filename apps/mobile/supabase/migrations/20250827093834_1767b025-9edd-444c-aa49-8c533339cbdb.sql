-- Enable RLS on remaining tables that need it for multi-tenant security
-- This completes the security hardening for multi-tenant setup

-- Enable RLS for all remaining tables without it
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_email_confirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE veriban_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE nilvera_auth ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE opex_matrix ENABLE ROW LEVEL SECURITY;

-- Fix RLS policies for tables that should use current_company_id() but use wrong user checks
-- Update policies to use current_company_id() consistently

-- audit_logs policy fix
DROP POLICY IF EXISTS "Company-based access" ON audit_logs;
CREATE POLICY "Company-based access" ON audit_logs 
FOR ALL 
TO authenticated 
USING (company_id = current_company_id());

-- exchange_rate_updates policy fix
DROP POLICY IF EXISTS "Company-based access" ON exchange_rate_updates;
CREATE POLICY "Company-based access" ON exchange_rate_updates 
FOR ALL 
TO authenticated 
USING (company_id = current_company_id());

-- exchange_rates policy fix
DROP POLICY IF EXISTS "Company-based access" ON exchange_rates;
CREATE POLICY "Company-based access" ON exchange_rates 
FOR ALL 
TO authenticated 
USING (company_id = current_company_id());

-- bank_accounts policy fix
DROP POLICY IF EXISTS "Company-based access" ON bank_accounts;
CREATE POLICY "Company-based access" ON bank_accounts 
FOR ALL 
TO authenticated 
USING (company_id = current_company_id());

-- bank_transactions policy fix
DROP POLICY IF EXISTS "Company-based access" ON bank_transactions;
CREATE POLICY "Company-based access" ON bank_transactions 
FOR ALL 
TO authenticated 
USING (company_id = current_company_id());

-- card_transactions policy fix
DROP POLICY IF EXISTS "Company-based access" ON card_transactions;
CREATE POLICY "Company-based access" ON card_transactions 
FOR ALL 
TO authenticated 
USING (company_id = current_company_id());

-- cash_flow_forecasts policy fix
DROP POLICY IF EXISTS "Company-based access" ON cash_flow_forecasts;
CREATE POLICY "Company-based access" ON cash_flow_forecasts 
FOR ALL 
TO authenticated 
USING (company_id = current_company_id());

-- cashflow_categories policy fix
DROP POLICY IF EXISTS "Company-based access" ON cashflow_categories;
CREATE POLICY "Company-based access" ON cashflow_categories 
FOR ALL 
TO authenticated 
USING (company_id = current_company_id());

-- cashflow_main policy fix
DROP POLICY IF EXISTS "Company-based access" ON cashflow_main;
CREATE POLICY "Company-based access" ON cashflow_main 
FOR ALL 
TO authenticated 
USING (company_id = current_company_id());

-- cashflow_transactions policy fix
DROP POLICY IF EXISTS "Company-based access" ON cashflow_transactions;
CREATE POLICY "Company-based access" ON cashflow_transactions 
FOR ALL 
TO authenticated 
USING (company_id = current_company_id());