-- Migration: proposal_terms company-based structure
-- Make proposal_terms company-specific and auto-create default terms for new companies

-- Step 1: Make company_id NOT NULL (if there are existing rows without company_id, they will be deleted)
-- Delete any rows without a company_id first
DELETE FROM public.proposal_terms WHERE company_id IS NULL;

-- Step 2: Make company_id NOT NULL
ALTER TABLE public.proposal_terms
  ALTER COLUMN company_id SET NOT NULL;

-- Step 3: Remove is_default column (no longer needed)
ALTER TABLE public.proposal_terms
  DROP COLUMN IF EXISTS is_default;

-- Step 4: Create function to insert default proposal terms for a new company
CREATE OR REPLACE FUNCTION public.create_default_proposal_terms(p_company_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert default payment terms
  INSERT INTO public.proposal_terms (company_id, category, label, text, is_active, sort_order)
  VALUES
    (p_company_id, 'payment', '%100 peşin ödeme yapılacaktır.', '%100 peşin ödeme yapılacaktır.', true, 1),
    (p_company_id, 'payment', '%30 avans, kalan %70 teslimde ödenecektir.', '%30 avans, kalan %70 teslimde ödenecektir.', true, 2),
    (p_company_id, 'payment', '%50 avans, kalan %50 teslimde ödenecektir.', '%50 avans, kalan %50 teslimde ödenecektir.', true, 3),
    (p_company_id, 'payment', 'Fatura tarihinden itibaren 30 gün vadeli ödenecektir.', 'Fatura tarihinden itibaren 30 gün vadeli ödenecektir.', true, 4);

  -- Insert default delivery terms
  INSERT INTO public.proposal_terms (company_id, category, label, text, is_active, sort_order)
  VALUES
    (p_company_id, 'delivery', 'Sipariş tarihinden itibaren 7-10 iş günü içinde teslimat yapılacaktır.', 'Sipariş tarihinden itibaren 7-10 iş günü içinde teslimat yapılacaktır.', true, 1),
    (p_company_id, 'delivery', 'Sipariş tarihinden itibaren 15-20 iş günü içinde teslimat yapılacaktır.', 'Sipariş tarihinden itibaren 15-20 iş günü içinde teslimat yapılacaktır.', true, 2),
    (p_company_id, 'delivery', 'Sipariş tarihinden itibaren 3-5 iş günü içinde teslimat yapılacaktır.', 'Sipariş tarihinden itibaren 3-5 iş günü içinde teslimat yapılacaktır.', true, 3);

  -- Insert default warranty terms
  INSERT INTO public.proposal_terms (company_id, category, label, text, is_active, sort_order)
  VALUES
    (p_company_id, 'warranty', 'Ürünlerimiz 1 yıl garantilidir.', 'Ürünlerimiz 1 yıl garantilidir.', true, 1),
    (p_company_id, 'warranty', 'Ürünlerimiz 2 yıl garantilidir.', 'Ürünlerimiz 2 yıl garantilidir.', true, 2),
    (p_company_id, 'warranty', 'Ürünlerimiz 3 yıl garantilidir.', 'Ürünlerimiz 3 yıl garantilidir.', true, 3);

  -- Insert default price terms
  INSERT INTO public.proposal_terms (company_id, category, label, text, is_active, sort_order)
  VALUES
    (p_company_id, 'price', 'Belirtilen fiyatlar KDV hariçtir.', 'Belirtilen fiyatlar KDV hariçtir.', true, 1),
    (p_company_id, 'price', 'Belirtilen fiyatlar KDV dahildir.', 'Belirtilen fiyatlar KDV dahildir.', true, 2),
    (p_company_id, 'price', 'Fiyatlar 30 gün geçerlidir.', 'Fiyatlar 30 gün geçerlidir.', true, 3);
END;
$$;

-- Step 5: Create trigger to automatically create default proposal terms when a new company is created
CREATE OR REPLACE FUNCTION public.handle_new_company_proposal_terms()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create default proposal terms for the new company
  PERFORM public.create_default_proposal_terms(NEW.id);
  RETURN NEW;
END;
$$;

-- Drop trigger if exists (to avoid duplicates)
DROP TRIGGER IF EXISTS trigger_create_default_proposal_terms ON public.companies;

-- Create trigger on companies table
CREATE TRIGGER trigger_create_default_proposal_terms
  AFTER INSERT ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_company_proposal_terms();

-- Step 6: Add trigger to auto-set company_id on insert
DROP TRIGGER IF EXISTS set_company_id_proposal_terms ON public.proposal_terms;

CREATE TRIGGER set_company_id_proposal_terms
  BEFORE INSERT ON public.proposal_terms
  FOR EACH ROW
  EXECUTE FUNCTION set_company_id_on_insert();

-- Step 7: Update RLS policy to use company_id directly instead of through proposals table
DROP POLICY IF EXISTS "Company-based access" ON public.proposal_terms;

CREATE POLICY "Company-based access" ON public.proposal_terms
  FOR ALL
  TO authenticated
  USING (company_id = current_company_id())
  WITH CHECK (company_id = current_company_id());

-- Step 8: Ensure existing companies have default terms
-- This will create default terms for all existing companies that don't have any terms yet
DO $$
DECLARE
  company_record RECORD;
  term_count INTEGER;
BEGIN
  FOR company_record IN SELECT id FROM public.companies
  LOOP
    -- Check if company already has terms
    SELECT COUNT(*) INTO term_count
    FROM public.proposal_terms
    WHERE company_id = company_record.id;

    -- If no terms exist, create default ones
    IF term_count = 0 THEN
      PERFORM public.create_default_proposal_terms(company_record.id);
    END IF;
  END LOOP;
END $$;

COMMENT ON FUNCTION public.create_default_proposal_terms(UUID) IS 'Creates default proposal terms (payment, delivery, warranty, price) for a given company';
COMMENT ON FUNCTION public.handle_new_company_proposal_terms() IS 'Trigger function to automatically create default proposal terms when a new company is created';
