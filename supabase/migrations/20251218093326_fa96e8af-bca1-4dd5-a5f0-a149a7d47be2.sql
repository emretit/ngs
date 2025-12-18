-- Add missing columns to einvoices_received table for caching
ALTER TABLE einvoices_received 
ADD COLUMN IF NOT EXISTS invoice_type text,
ADD COLUMN IF NOT EXISTS invoice_profile text,
ADD COLUMN IF NOT EXISTS due_date date,
ADD COLUMN IF NOT EXISTS fetched_at timestamp with time zone DEFAULT now();

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_einvoices_received_company_date 
ON einvoices_received(company_id, invoice_date DESC);

CREATE INDEX IF NOT EXISTS idx_einvoices_received_invoice_uuid 
ON einvoices_received(invoice_uuid);

-- Enable RLS if not already enabled
ALTER TABLE einvoices_received ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for company access
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'einvoices_received' 
    AND policyname = 'Users can view their company einvoices'
  ) THEN
    CREATE POLICY "Users can view their company einvoices" 
    ON einvoices_received 
    FOR SELECT 
    USING (company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    ));
  END IF;
END $$;