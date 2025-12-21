-- Enable RLS only on existing tables that need it for multi-tenant security
-- Skip tables that don't exist yet

-- Enable RLS for existing tables without it (removing non-existent ones)
ALTER TABLE IF EXISTS opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS products ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS proposal_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS proposal_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS service_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_email_confirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS veriban_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS nilvera_auth ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS sales_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS opex_matrix ENABLE ROW LEVEL SECURITY;

-- Continue with policy fixes for existing tables
-- checks policy fix  
DROP POLICY IF EXISTS "Company-based access" ON checks;
CREATE POLICY "Company-based access" ON checks 
FOR ALL 
TO authenticated 
USING (company_id = current_company_id());

-- credit_cards policy fix
DROP POLICY IF EXISTS "Company-based access" ON credit_cards;
CREATE POLICY "Company-based access" ON credit_cards 
FOR ALL 
TO authenticated 
USING (company_id = current_company_id());

-- customer_aliases policy fix
DROP POLICY IF EXISTS "Company-based access" ON customer_aliases;
CREATE POLICY "Company-based access" ON customer_aliases 
FOR ALL 
TO authenticated 
USING (company_id = current_company_id());

-- customers policy fix
DROP POLICY IF EXISTS "Company-based access" ON customers;
CREATE POLICY "Company-based access" ON customers 
FOR ALL 
TO authenticated 
USING (company_id = current_company_id());

-- departments policy fix
DROP POLICY IF EXISTS "Company-based access" ON departments;
CREATE POLICY "Company-based access" ON departments 
FOR ALL 
TO authenticated 
USING (company_id = current_company_id());