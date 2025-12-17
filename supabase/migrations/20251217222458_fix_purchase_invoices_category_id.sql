-- Fix purchase_invoices.category_id to accept both category and subcategory IDs
-- Drop existing foreign key constraint if it exists
DO $$ 
BEGIN
    -- Drop the foreign key constraint if it exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'purchase_invoices_category_id_fkey'
        AND table_name = 'purchase_invoices'
    ) THEN
        ALTER TABLE public.purchase_invoices 
        DROP CONSTRAINT purchase_invoices_category_id_fkey;
    END IF;
END $$;

-- Create a check constraint that validates the category_id exists in either cashflow_categories or cashflow_subcategories
-- Note: We can't create a foreign key to multiple tables, so we'll use a function-based check
CREATE OR REPLACE FUNCTION check_category_or_subcategory_exists(category_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if it exists in cashflow_categories
    IF EXISTS (SELECT 1 FROM public.cashflow_categories WHERE id = category_id) THEN
        RETURN TRUE;
    END IF;
    
    -- Check if it exists in cashflow_subcategories
    IF EXISTS (SELECT 1 FROM public.cashflow_subcategories WHERE id = category_id) THEN
        RETURN TRUE;
    END IF;
    
    -- If category_id is NULL, that's also valid
    IF category_id IS NULL THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add check constraint
ALTER TABLE public.purchase_invoices
ADD CONSTRAINT purchase_invoices_category_id_check
CHECK (check_category_or_subcategory_exists(category_id));

-- Add comment
COMMENT ON COLUMN public.purchase_invoices.category_id IS 
'Can reference either cashflow_categories.id (main category) or cashflow_subcategories.id (subcategory)';

