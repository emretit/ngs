-- Fix RLS policies for tables that are missing them

-- Add RLS policies for einvoice_queue table
CREATE POLICY "Company-based access" ON public.einvoice_queue
FOR ALL USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- Add RLS policies for e_invoice_drafts table  
CREATE POLICY "Company-based access" ON public.e_invoice_drafts
FOR ALL USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- Add RLS policies for e_invoice_settings table
CREATE POLICY "Company-based access" ON public.e_invoice_settings
FOR ALL USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- Fix database functions security by adding search_path
CREATE OR REPLACE FUNCTION public.get_user_company_context()
RETURNS TABLE(user_id uuid, company_id uuid, company_name text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    auth.uid() as user_id,
    p.company_id,
    c.name as company_name
  FROM public.profiles p
  LEFT JOIN public.companies c ON c.id = p.company_id
  WHERE p.id = auth.uid();
END;
$function$;