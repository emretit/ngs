-- Phase 6: Complete RLS Security Coverage - Create missing policies only for tables that don't have them

-- Check and create policies only for tables that don't have "Company-based access" policy yet

-- Critical: Active tables that need immediate RLS policies
DO $$
BEGIN
    -- opportunity_types
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'opportunity_types' AND policyname = 'Company-based access') THEN
        EXECUTE 'CREATE POLICY "Company-based access" ON public.opportunity_types FOR ALL USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id())';
    END IF;
    
    -- pdf_templates  
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pdf_templates' AND policyname = 'Company-based access') THEN
        EXECUTE 'CREATE POLICY "Company-based access" ON public.pdf_templates FOR ALL USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id())';
    END IF;
    
    -- purchase_invoices
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'purchase_invoices' AND policyname = 'Company-based access') THEN
        EXECUTE 'CREATE POLICY "Company-based access" ON public.purchase_invoices FOR ALL USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id())';
    END IF;
    
    -- payment_notifications
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payment_notifications' AND policyname = 'Company-based access') THEN
        EXECUTE 'CREATE POLICY "Company-based access" ON public.payment_notifications FOR ALL USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id())';
    END IF;
    
    -- purchase_requests
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'purchase_requests' AND policyname = 'Company-based access') THEN
        EXECUTE 'CREATE POLICY "Company-based access" ON public.purchase_requests FOR ALL USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id())';
    END IF;
    
    -- purchase_request_items
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'purchase_request_items' AND policyname = 'Company-based access') THEN
        EXECUTE 'CREATE POLICY "Company-based access" ON public.purchase_request_items FOR ALL USING (EXISTS (SELECT 1 FROM public.purchase_requests WHERE purchase_requests.id = purchase_request_items.request_id AND purchase_requests.company_id = current_company_id()))';
    END IF;
    
    -- orgs
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'orgs' AND policyname = 'Company-based access') THEN
        EXECUTE 'CREATE POLICY "Company-based access" ON public.orgs FOR ALL USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id())';
    END IF;
    
    -- proposal_terms
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'proposal_terms' AND policyname = 'Company-based access') THEN
        EXECUTE 'CREATE POLICY "Company-based access" ON public.proposal_terms FOR ALL USING (EXISTS (SELECT 1 FROM public.proposals WHERE proposals.id = proposal_terms.proposal_id AND proposals.company_id = current_company_id()))';
    END IF;
END $$;

-- Add company_id triggers for tables that don't have them yet
DO $$
BEGIN
    -- opportunity_types
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_company_id_opportunity_types') THEN
        EXECUTE 'CREATE TRIGGER set_company_id_opportunity_types BEFORE INSERT ON public.opportunity_types FOR EACH ROW EXECUTE FUNCTION set_company_id_on_insert()';
    END IF;
    
    -- pdf_templates
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_company_id_pdf_templates') THEN
        EXECUTE 'CREATE TRIGGER set_company_id_pdf_templates BEFORE INSERT ON public.pdf_templates FOR EACH ROW EXECUTE FUNCTION set_company_id_on_insert()';
    END IF;
    
    -- purchase_invoices
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_company_id_purchase_invoices') THEN
        EXECUTE 'CREATE TRIGGER set_company_id_purchase_invoices BEFORE INSERT ON public.purchase_invoices FOR EACH ROW EXECUTE FUNCTION set_company_id_on_insert()';
    END IF;
    
    -- payment_notifications
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_company_id_payment_notifications') THEN
        EXECUTE 'CREATE TRIGGER set_company_id_payment_notifications BEFORE INSERT ON public.payment_notifications FOR EACH ROW EXECUTE FUNCTION set_company_id_on_insert()';
    END IF;
    
    -- purchase_requests
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_company_id_purchase_requests') THEN
        EXECUTE 'CREATE TRIGGER set_company_id_purchase_requests BEFORE INSERT ON public.purchase_requests FOR EACH ROW EXECUTE FUNCTION set_company_id_on_insert()';
    END IF;
    
    -- orgs
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_company_id_orgs') THEN
        EXECUTE 'CREATE TRIGGER set_company_id_orgs BEFORE INSERT ON public.orgs FOR EACH ROW EXECUTE FUNCTION set_company_id_on_insert()';
    END IF;
END $$;