-- Create new trigger function with correct naming
CREATE OR REPLACE FUNCTION public.set_company_id_on_insert()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.company_id IS NULL THEN
    -- current_company_id() kullanarak kullanıcının company_id'sini al
    NEW.company_id = current_company_id();
  END IF;
  RETURN NEW;
END;
$function$;

-- Update triggers on activities table
DROP TRIGGER IF EXISTS set_project_id_activities ON public.activities;
CREATE TRIGGER set_company_id_activities
  BEFORE INSERT ON public.activities
  FOR EACH ROW
  EXECUTE FUNCTION set_company_id_on_insert();

-- Update triggers on opportunities table  
DROP TRIGGER IF EXISTS set_project_id_opportunities ON public.opportunities;
CREATE TRIGGER set_company_id_opportunities
  BEFORE INSERT ON public.opportunities
  FOR EACH ROW
  EXECUTE FUNCTION set_company_id_on_insert();

-- Update triggers on proposals table
DROP TRIGGER IF EXISTS set_project_id_proposals ON public.proposals;
CREATE TRIGGER set_company_id_proposals
  BEFORE INSERT ON public.proposals
  FOR EACH ROW
  EXECUTE FUNCTION set_company_id_on_insert();

-- Clean up old functions
DROP FUNCTION IF EXISTS public.set_project_id_on_insert();
DROP FUNCTION IF EXISTS public.current_project_id();