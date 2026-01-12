-- Drop the old constraint
ALTER TABLE sales_invoices DROP CONSTRAINT IF EXISTS sales_invoices_invoice_profile_check;

-- Add new constraint with all valid invoice profile types
ALTER TABLE sales_invoices
ADD CONSTRAINT sales_invoices_invoice_profile_check
CHECK (invoice_profile IN (
  'TEMELFATURA',      -- Temel Fatura (E-Fatura)
  'TICARIFATURA',     -- Ticari Fatura (E-Fatura)
  'EARSIVFATURA',     -- E-Arşiv Fatura
  'EARSIVIRSLIYE'     -- E-Arşiv İrsaliye
));

-- Update existing NULL values to TEMELFATURA as default
UPDATE sales_invoices 
SET invoice_profile = 'TEMELFATURA' 
WHERE invoice_profile IS NULL;
