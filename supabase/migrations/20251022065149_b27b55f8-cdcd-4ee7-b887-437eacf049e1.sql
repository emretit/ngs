-- Add subject and exchange_rate columns to proposals table
ALTER TABLE proposals 
ADD COLUMN IF NOT EXISTS subject text,
ADD COLUMN IF NOT EXISTS exchange_rate numeric DEFAULT 1;

-- Add comment for documentation
COMMENT ON COLUMN proposals.subject IS 'Teklif konusu/başlığı';
COMMENT ON COLUMN proposals.exchange_rate IS 'Döviz kuru (TRY bazlı)';