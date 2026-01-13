-- E-Arşiv fatura takip alanları ekleme
-- Bu migration çift gönderim önleme ve durum takibi için gerekli alanları ekler

-- sales_invoices tablosuna transfer takip alanları ekle
ALTER TABLE sales_invoices
ADD COLUMN IF NOT EXISTS transfer_file_unique_id TEXT,
ADD COLUMN IF NOT EXISTS transfer_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS gib_status TEXT,
ADD COLUMN IF NOT EXISTS gib_status_code INTEGER,
ADD COLUMN IF NOT EXISTS transfer_retry_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_status_check_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS transfer_error_details JSONB;

-- transfer_status için check constraint
ALTER TABLE sales_invoices
DROP CONSTRAINT IF EXISTS sales_invoices_transfer_status_check;

ALTER TABLE sales_invoices
ADD CONSTRAINT sales_invoices_transfer_status_check
CHECK (transfer_status IN ('pending', 'queued', 'processing', 'sent', 'delivered', 'failed', 'cancelled'));

-- İndeksler ekle (performans için)
CREATE INDEX IF NOT EXISTS idx_sales_invoices_transfer_file_unique_id
ON sales_invoices(transfer_file_unique_id)
WHERE transfer_file_unique_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_sales_invoices_transfer_status
ON sales_invoices(transfer_status)
WHERE transfer_status IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_sales_invoices_pending_transfers
ON sales_invoices(company_id, transfer_status, last_status_check_at)
WHERE transfer_status IN ('queued', 'processing');

-- outgoing_invoices tablosuna da aynı alanları ekle (tutarlılık için)
ALTER TABLE outgoing_invoices
ADD COLUMN IF NOT EXISTS transfer_file_unique_id TEXT,
ADD COLUMN IF NOT EXISTS transfer_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS gib_status TEXT,
ADD COLUMN IF NOT EXISTS gib_status_code INTEGER,
ADD COLUMN IF NOT EXISTS last_status_check_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_outgoing_invoices_transfer_file_unique_id
ON outgoing_invoices(transfer_file_unique_id)
WHERE transfer_file_unique_id IS NOT NULL;

-- Yorum ekle
COMMENT ON COLUMN sales_invoices.transfer_file_unique_id IS 'Veriban TransferFileUniqueId (E-Arşiv gönderim takip numarası)';
COMMENT ON COLUMN sales_invoices.transfer_status IS 'Transfer durumu: pending, queued, processing, sent, delivered, failed, cancelled';
COMMENT ON COLUMN sales_invoices.gib_status IS 'GİB durumu (açıklama)';
COMMENT ON COLUMN sales_invoices.gib_status_code IS 'GİB durum kodu (5=başarılı, vb.)';
COMMENT ON COLUMN sales_invoices.transfer_retry_count IS 'Transfer yeniden deneme sayısı';
COMMENT ON COLUMN sales_invoices.last_status_check_at IS 'Son durum kontrol zamanı';
COMMENT ON COLUMN sales_invoices.transfer_error_details IS 'Transfer hata detayları (JSON)';
