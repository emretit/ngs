-- Add elogo_status and answer_type columns to sales_invoices table
-- These columns store e-invoice state information from Veriban XML

ALTER TABLE sales_invoices
ADD COLUMN IF NOT EXISTS elogo_status integer,
ADD COLUMN IF NOT EXISTS answer_type text,
ADD COLUMN IF NOT EXISTS elogo_code integer,
ADD COLUMN IF NOT EXISTS elogo_description text;

COMMENT ON COLUMN sales_invoices.elogo_status IS 'Veriban StateCode: 1=Taslak, 2=İmza Bekliyor, 3=Gönderim Listesi, 4=Hatalı, 5=Başarıyla İletildi';
COMMENT ON COLUMN sales_invoices.answer_type IS 'Veriban Answer Type: KABUL, RED, IADE';
COMMENT ON COLUMN sales_invoices.elogo_code IS 'Veriban Answer State Code';
COMMENT ON COLUMN sales_invoices.elogo_description IS 'Veriban Status Description';
