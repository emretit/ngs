-- Fix the cascade issue
DROP TRIGGER IF EXISTS trigger_set_order_rank ON public.activities;
DROP FUNCTION IF EXISTS public.set_order_rank_if_null() CASCADE;
DROP FUNCTION IF EXISTS public.generate_order_rank(TEXT, UUID) CASCADE;

-- Recreate with proper security settings
CREATE OR REPLACE FUNCTION public.generate_order_rank(
  status_column TEXT, 
  company_id_val UUID
) RETURNS TEXT AS $$
DECLARE
  max_rank TEXT;
  new_rank TEXT;
BEGIN
  -- Get the highest rank for this status and company
  SELECT order_rank INTO max_rank
  FROM public.activities
  WHERE status = status_column 
    AND company_id = company_id_val
    AND order_rank IS NOT NULL
  ORDER BY order_rank DESC
  LIMIT 1;
  
  -- If no existing rank, start with 'a0'
  IF max_rank IS NULL THEN
    new_rank := 'a0';
  ELSE
    -- Simple increment: if rank ends with digit, increment it
    new_rank := max_rank || '0';
  END IF;
  
  RETURN new_rank;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to auto-set order_rank when NULL
CREATE OR REPLACE FUNCTION public.set_order_rank_if_null()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_rank IS NULL AND NEW.type = 'task' THEN
    NEW.order_rank := public.generate_order_rank(NEW.status, NEW.company_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recreate trigger
CREATE TRIGGER trigger_set_order_rank
  BEFORE INSERT OR UPDATE ON public.activities
  FOR EACH ROW
  EXECUTE FUNCTION public.set_order_rank_if_null();