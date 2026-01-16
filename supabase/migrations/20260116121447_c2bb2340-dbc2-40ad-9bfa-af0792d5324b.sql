-- Add currency column to customers table
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'TRY';

-- Add currency column to suppliers table  
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'TRY';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_customers_currency ON public.customers(currency);
CREATE INDEX IF NOT EXISTS idx_suppliers_currency ON public.suppliers(currency);