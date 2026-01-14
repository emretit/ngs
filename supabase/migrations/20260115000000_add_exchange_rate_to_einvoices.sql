-- Add exchange_rate column to einvoices_received table
ALTER TABLE einvoices_received
ADD COLUMN IF NOT EXISTS exchange_rate NUMERIC(18,6);

COMMENT ON COLUMN einvoices_received.exchange_rate IS 'Döviz kuru bilgisi (TRY bazlı, örn: 1 USD = 35.50 TRY)';
