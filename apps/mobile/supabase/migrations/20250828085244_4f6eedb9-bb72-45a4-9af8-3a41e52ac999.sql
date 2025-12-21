-- Phase 6: Complete RLS Security Coverage - Create missing policies for all tables

-- Critical: Active tables that need immediate RLS policies
CREATE POLICY "Company-based access" ON public.opportunity_types
FOR ALL USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

CREATE POLICY "Company-based access" ON public.pdf_templates  
FOR ALL USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

CREATE POLICY "Company-based access" ON public.purchase_invoices
FOR ALL USING (company_id = current_company_id()) 
WITH CHECK (company_id = current_company_id());

-- Future-ready: Tables that will be used soon
CREATE POLICY "Company-based access" ON public.payment_notifications
FOR ALL USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

CREATE POLICY "Company-based access" ON public.purchase_requests
FOR ALL USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

CREATE POLICY "Company-based access" ON public.purchase_request_items
FOR ALL USING (EXISTS (
  SELECT 1 FROM public.purchase_requests 
  WHERE purchase_requests.id = purchase_request_items.request_id 
  AND purchase_requests.company_id = current_company_id()
));

CREATE POLICY "Company-based access" ON public.sales_tracking
FOR ALL USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- Veriban related tables
CREATE POLICY "Company-based access" ON public.veriban_settings
FOR ALL USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

CREATE POLICY "Company-based access" ON public.veriban_transactions
FOR ALL USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- Organization structure
CREATE POLICY "Company-based access" ON public.orgs
FOR ALL USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- Additional security for proposal-related tables
CREATE POLICY "Company-based access" ON public.proposal_terms
FOR ALL USING (EXISTS (
  SELECT 1 FROM public.proposals 
  WHERE proposals.id = proposal_terms.proposal_id 
  AND proposals.company_id = current_company_id()
));

-- Add company_id triggers for tables that don't have them yet
CREATE TRIGGER set_company_id_opportunity_types
  BEFORE INSERT ON public.opportunity_types
  FOR EACH ROW
  EXECUTE FUNCTION set_company_id_on_insert();

CREATE TRIGGER set_company_id_pdf_templates
  BEFORE INSERT ON public.pdf_templates  
  FOR EACH ROW
  EXECUTE FUNCTION set_company_id_on_insert();

CREATE TRIGGER set_company_id_purchase_invoices
  BEFORE INSERT ON public.purchase_invoices
  FOR EACH ROW
  EXECUTE FUNCTION set_company_id_on_insert();

CREATE TRIGGER set_company_id_payment_notifications
  BEFORE INSERT ON public.payment_notifications
  FOR EACH ROW
  EXECUTE FUNCTION set_company_id_on_insert();

CREATE TRIGGER set_company_id_purchase_requests
  BEFORE INSERT ON public.purchase_requests
  FOR EACH ROW
  EXECUTE FUNCTION set_company_id_on_insert();

CREATE TRIGGER set_company_id_sales_tracking
  BEFORE INSERT ON public.sales_tracking
  FOR EACH ROW
  EXECUTE FUNCTION set_company_id_on_insert();

CREATE TRIGGER set_company_id_orgs
  BEFORE INSERT ON public.orgs
  FOR EACH ROW
  EXECUTE FUNCTION set_company_id_on_insert();