-- Create purchase_invoice_items table for e-invoice processing
CREATE TABLE IF NOT EXISTS public.purchase_invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_invoice_id UUID NOT NULL REFERENCES public.purchase_invoices(id) ON DELETE CASCADE,
    product_id UUID NULL REFERENCES public.products(id),
    product_name TEXT NOT NULL,
    sku TEXT NULL,
    quantity NUMERIC NOT NULL DEFAULT 1,
    unit TEXT NOT NULL DEFAULT 'Adet',
    unit_price NUMERIC NOT NULL DEFAULT 0,
    tax_rate NUMERIC NOT NULL DEFAULT 18,
    discount_rate NUMERIC NOT NULL DEFAULT 0,
    line_total NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    company_id UUID NULL
);

-- Enable RLS
ALTER TABLE public.purchase_invoice_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for purchase invoice items
CREATE POLICY "Company-based access for purchase invoice items" 
ON public.purchase_invoice_items 
FOR ALL 
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- Add company_id to purchase_invoices if not exists and create index
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'purchase_invoices' AND column_name = 'einvoice_id') THEN
        ALTER TABLE public.purchase_invoices ADD COLUMN einvoice_id TEXT NULL;
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_purchase_invoice_items_purchase_invoice_id ON public.purchase_invoice_items(purchase_invoice_id);
CREATE INDEX IF NOT EXISTS idx_purchase_invoice_items_product_id ON public.purchase_invoice_items(product_id);
CREATE INDEX IF NOT EXISTS idx_purchase_invoice_items_company_id ON public.purchase_invoice_items(company_id);