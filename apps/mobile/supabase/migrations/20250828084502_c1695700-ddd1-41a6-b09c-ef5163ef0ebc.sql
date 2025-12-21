-- Phase 4: Veri Bütünlüğü Sağlama - Complete remaining security fixes

-- Fix search_path for all remaining functions
CREATE OR REPLACE FUNCTION auth.email()
 RETURNS text
 LANGUAGE sql
 STABLE
 SET search_path = auth, pg_temp
AS $function$
  select 
  	coalesce(
		nullif(current_setting('request.jwt.claim.email', true), ''),
		(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')
	)::text
$function$;

CREATE OR REPLACE FUNCTION auth.role()
 RETURNS text
 LANGUAGE sql
 STABLE
 SET search_path = auth, pg_temp
AS $function$
  select 
  	coalesce(
		nullif(current_setting('request.jwt.claim.role', true), ''),
		(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
	)::text
$function$;

CREATE OR REPLACE FUNCTION auth.uid()
 RETURNS uuid
 LANGUAGE sql
 STABLE
 SET search_path = auth, pg_temp
AS $function$
  select 
  	coalesce(
		nullif(current_setting('request.jwt.claim.sub', true), ''),
		(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
	)::uuid
$function$;

-- Create missing RLS policies for tables that have RLS enabled but no policies
CREATE POLICY "Company-based access" ON public.product_categories
FOR ALL USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

CREATE POLICY "Company-based access" ON public.profiles
FOR ALL USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

CREATE POLICY "Company-based access" ON public.proposals
FOR ALL USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

CREATE POLICY "Company-based access" ON public.proposal_items
FOR ALL USING (EXISTS (
  SELECT 1 FROM public.proposals 
  WHERE proposals.id = proposal_items.proposal_id 
  AND proposals.company_id = current_company_id()
));

CREATE POLICY "Company-based access" ON public.proposal_templates
FOR ALL USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

CREATE POLICY "Company-based access" ON public.opportunities
FOR ALL USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

CREATE POLICY "Company-based access" ON public.opportunity_columns
FOR ALL USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

CREATE POLICY "Company-based access" ON public.products
FOR ALL USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

CREATE POLICY "Company-based access" ON public.suppliers
FOR ALL USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

CREATE POLICY "Company-based access" ON public.quotations
FOR ALL USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

CREATE POLICY "Company-based access" ON public.quotation_items
FOR ALL USING (EXISTS (
  SELECT 1 FROM public.quotations 
  WHERE quotations.id = quotation_items.quotation_id 
  AND quotations.company_id = current_company_id()
));

-- Add validation constraints for critical tables
ALTER TABLE public.products 
ADD CONSTRAINT check_positive_price CHECK (price >= 0),
ADD CONSTRAINT check_positive_stock CHECK (stock_quantity >= 0),
ADD CONSTRAINT check_tax_rate_range CHECK (tax_rate >= 0 AND tax_rate <= 100);

ALTER TABLE public.proposal_items 
ADD CONSTRAINT check_positive_quantity CHECK (quantity > 0),
ADD CONSTRAINT check_positive_unit_price CHECK (unit_price >= 0),
ADD CONSTRAINT check_valid_discount_rate CHECK (discount_rate >= 0 AND discount_rate <= 100),
ADD CONSTRAINT check_valid_tax_rate CHECK (tax_rate >= 0 AND tax_rate <= 100);

-- Ensure company_id is not null for critical tables
UPDATE public.products SET company_id = current_company_id() WHERE company_id IS NULL;
UPDATE public.proposals SET company_id = current_company_id() WHERE company_id IS NULL;
UPDATE public.opportunities SET company_id = current_company_id() WHERE company_id IS NULL;

-- Add NOT NULL constraints after ensuring data integrity
ALTER TABLE public.products ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.proposals ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.opportunities ALTER COLUMN company_id SET NOT NULL;