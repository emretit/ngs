-- Add unique constraint for upsert to work
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'einvoices_received_invoice_uuid_key'
  ) THEN
    ALTER TABLE einvoices_received ADD CONSTRAINT einvoices_received_invoice_uuid_key UNIQUE (invoice_uuid);
  END IF;
END $$;