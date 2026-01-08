-- Fix data inconsistencies in sales_invoices and outgoing_invoices tables
-- This migration ensures elogo_status (StateCode) is the single source of truth

-- ============================================================================
-- PART 1: Fix outgoing_invoices table
-- ============================================================================

-- Fix: status='cancelled' but elogo_status=5 (successfully delivered)
-- These should have status='delivered' since elogo_status=5 means successfully delivered
UPDATE outgoing_invoices
SET 
  status = 'delivered',
  updated_at = NOW()
WHERE 
  status = 'cancelled' 
  AND elogo_status = 5
  AND answer_type = 'KABUL';

COMMENT ON UPDATE IS 'Fixed: status was "cancelled" but elogo_status=5 (successfully delivered)';

-- Fix: status='sent' but elogo_status=2 (waiting for signature)
-- These should have status='pending' since elogo_status=2 means waiting for signature
UPDATE outgoing_invoices
SET 
  status = 'pending',
  updated_at = NOW()
WHERE 
  status = 'sent' 
  AND elogo_status = 2;

COMMENT ON UPDATE IS 'Fixed: status was "sent" but elogo_status=2 (waiting for signature)';

-- Fix: status='error' but elogo_status=4 (error) - this is correct, but let's ensure consistency
-- No update needed, just verification

-- Fix: answer_type='KABUL' but elogo_status != 5
-- If answer_type is set, elogo_status should be 5 (successfully delivered)
UPDATE outgoing_invoices
SET 
  answer_type = NULL,
  answer_description = NULL,
  updated_at = NOW()
WHERE 
  answer_type IS NOT NULL 
  AND elogo_status != 5;

COMMENT ON UPDATE IS 'Fixed: answer_type was set but elogo_status != 5 (not delivered yet)';

-- ============================================================================
-- PART 2: Fix sales_invoices table
-- ============================================================================

-- Fix: einvoice_status='sent' but elogo_status=5 and answer_type='KABUL'
-- Should be einvoice_status='delivered' or 'accepted'
UPDATE sales_invoices
SET 
  einvoice_status = 'delivered',
  updated_at = NOW()
WHERE 
  einvoice_status = 'sent' 
  AND elogo_status = 5
  AND answer_type IS NOT NULL;

COMMENT ON UPDATE IS 'Fixed: einvoice_status was "sent" but elogo_status=5 (successfully delivered)';

-- Fix: einvoice_status='draft' but durum='gonderildi'
-- This is inconsistent - if durum is 'gonderildi', invoice should not be draft
UPDATE sales_invoices
SET 
  einvoice_status = 'sent',
  updated_at = NOW()
WHERE 
  einvoice_status = 'draft' 
  AND durum = 'gonderildi'
  AND elogo_status IS NULL;

COMMENT ON UPDATE IS 'Fixed: einvoice_status was "draft" but durum="gonderildi"';

-- Fix: einvoice_status='draft' but durum='onaylandi'
-- If invoice is approved (onaylandi), it should not be draft
UPDATE sales_invoices
SET 
  einvoice_status = 'sent',
  updated_at = NOW()
WHERE 
  einvoice_status = 'draft' 
  AND durum = 'onaylandi'
  AND elogo_status IS NULL;

COMMENT ON UPDATE IS 'Fixed: einvoice_status was "draft" but durum="onaylandi"';

-- ============================================================================
-- PART 3: Sync einvoice_status from elogo_status for all records
-- ============================================================================

-- Update einvoice_status based on elogo_status for all sales_invoices
-- This ensures einvoice_status reflects the actual state from Veriban

-- StateCode 1 = Taslak -> einvoice_status = 'draft'
UPDATE sales_invoices
SET 
  einvoice_status = 'draft',
  updated_at = NOW()
WHERE 
  elogo_status = 1
  AND (einvoice_status IS NULL OR einvoice_status != 'draft');

-- StateCode 2 = İmza Bekliyor -> einvoice_status = 'pending'
UPDATE sales_invoices
SET 
  einvoice_status = 'pending',
  updated_at = NOW()
WHERE 
  elogo_status = 2
  AND (einvoice_status IS NULL OR einvoice_status != 'pending');

-- StateCode 3 = Gönderim Listesinde -> einvoice_status = 'sending'
UPDATE sales_invoices
SET 
  einvoice_status = 'sending',
  updated_at = NOW()
WHERE 
  elogo_status = 3
  AND (einvoice_status IS NULL OR einvoice_status != 'sending');

-- StateCode 4 = Hatalı -> einvoice_status = 'error'
UPDATE sales_invoices
SET 
  einvoice_status = 'error',
  updated_at = NOW()
WHERE 
  elogo_status = 4
  AND (einvoice_status IS NULL OR einvoice_status != 'error');

-- StateCode 5 + AnswerType = KABUL -> einvoice_status = 'accepted'
UPDATE sales_invoices
SET 
  einvoice_status = 'accepted',
  updated_at = NOW()
WHERE 
  elogo_status = 5
  AND answer_type = 'KABUL'
  AND (einvoice_status IS NULL OR einvoice_status != 'accepted');

-- StateCode 5 + AnswerType = RED -> einvoice_status = 'rejected'
UPDATE sales_invoices
SET 
  einvoice_status = 'rejected',
  updated_at = NOW()
WHERE 
  elogo_status = 5
  AND answer_type = 'RED'
  AND (einvoice_status IS NULL OR einvoice_status != 'rejected');

-- StateCode 5 + AnswerType = IADE -> einvoice_status = 'returned'
UPDATE sales_invoices
SET 
  einvoice_status = 'returned',
  updated_at = NOW()
WHERE 
  elogo_status = 5
  AND answer_type = 'IADE'
  AND (einvoice_status IS NULL OR einvoice_status != 'returned');

-- StateCode 5 + No AnswerType -> einvoice_status = 'delivered'
UPDATE sales_invoices
SET 
  einvoice_status = 'delivered',
  updated_at = NOW()
WHERE 
  elogo_status = 5
  AND answer_type IS NULL
  AND (einvoice_status IS NULL OR einvoice_status != 'delivered');

-- ============================================================================
-- PART 4: Add comments for documentation
-- ============================================================================

COMMENT ON COLUMN sales_invoices.elogo_status IS 
  'Veriban StateCode (Single Source of Truth): 1=Taslak, 2=İmza Bekliyor, 3=Gönderim Listesi, 4=Hatalı, 5=Başarıyla İletildi';

COMMENT ON COLUMN sales_invoices.einvoice_status IS 
  'E-fatura gönderim durumu (Derived from elogo_status): draft, pending, sending, error, sent, delivered, accepted, rejected, returned';

COMMENT ON COLUMN sales_invoices.elogo_code IS 
  'Veriban AnswerStateCode: 0=Cevap Bekleniyor, 1=Kabul Edildi, 2=Reddedildi, 3=İade Edildi';

COMMENT ON COLUMN sales_invoices.answer_type IS 
  'Alıcı cevap tipi: KABUL, RED, IADE (Only set when elogo_status=5)';

COMMENT ON COLUMN outgoing_invoices.elogo_status IS 
  'Veriban StateCode (Single Source of Truth): 1=Taslak, 2=İmza Bekliyor, 3=Gönderim Listesi, 4=Hatalı, 5=Başarıyla İletildi';

COMMENT ON COLUMN outgoing_invoices.status IS 
  'Genel durum (Derived from elogo_status): draft, pending, sending, sent, delivered, error, cancelled';

-- ============================================================================
-- VERIFICATION QUERIES (For manual checking after migration)
-- ============================================================================

-- Count records with potential inconsistencies in sales_invoices
-- SELECT 
--   einvoice_status,
--   elogo_status,
--   answer_type,
--   durum,
--   COUNT(*) as count
-- FROM sales_invoices
-- WHERE 
--   (elogo_status = 5 AND einvoice_status NOT IN ('delivered', 'accepted', 'rejected', 'returned'))
--   OR (elogo_status = 4 AND einvoice_status != 'error')
--   OR (elogo_status = 3 AND einvoice_status != 'sending')
--   OR (elogo_status = 2 AND einvoice_status != 'pending')
--   OR (elogo_status = 1 AND einvoice_status != 'draft')
-- GROUP BY einvoice_status, elogo_status, answer_type, durum;

-- Count records with potential inconsistencies in outgoing_invoices
-- SELECT 
--   status,
--   elogo_status,
--   answer_type,
--   COUNT(*) as count
-- FROM outgoing_invoices
-- WHERE 
--   (elogo_status = 5 AND status NOT IN ('delivered', 'cancelled'))
--   OR (elogo_status = 4 AND status != 'error')
--   OR (elogo_status = 2 AND status NOT IN ('pending', 'sent'))
--   OR (answer_type IS NOT NULL AND elogo_status != 5)
-- GROUP BY status, elogo_status, answer_type;
