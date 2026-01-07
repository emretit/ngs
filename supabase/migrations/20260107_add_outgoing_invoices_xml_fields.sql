-- Add missing XML fields to outgoing_invoices table
-- Based on UBL-TR XML analysis, adding high and medium priority fields

-- Supplier (AccountingSupplierParty) Information
ALTER TABLE outgoing_invoices ADD COLUMN IF NOT EXISTS supplier_name TEXT;
ALTER TABLE outgoing_invoices ADD COLUMN IF NOT EXISTS supplier_tax_number TEXT;
ALTER TABLE outgoing_invoices ADD COLUMN IF NOT EXISTS supplier_tax_office TEXT;
ALTER TABLE outgoing_invoices ADD COLUMN IF NOT EXISTS supplier_address_street TEXT;
ALTER TABLE outgoing_invoices ADD COLUMN IF NOT EXISTS supplier_address_city TEXT;
ALTER TABLE outgoing_invoices ADD COLUMN IF NOT EXISTS supplier_address_district TEXT;
ALTER TABLE outgoing_invoices ADD COLUMN IF NOT EXISTS supplier_contact_telephone TEXT;
ALTER TABLE outgoing_invoices ADD COLUMN IF NOT EXISTS supplier_contact_email TEXT;

-- Customer (AccountingCustomerParty) Extended Information
ALTER TABLE outgoing_invoices ADD COLUMN IF NOT EXISTS customer_tax_office TEXT;
ALTER TABLE outgoing_invoices ADD COLUMN IF NOT EXISTS customer_address_street TEXT;
ALTER TABLE outgoing_invoices ADD COLUMN IF NOT EXISTS customer_address_city TEXT;
ALTER TABLE outgoing_invoices ADD COLUMN IF NOT EXISTS customer_address_district TEXT;
ALTER TABLE outgoing_invoices ADD COLUMN IF NOT EXISTS customer_address_postal_zone TEXT;
ALTER TABLE outgoing_invoices ADD COLUMN IF NOT EXISTS customer_address_country TEXT;
ALTER TABLE outgoing_invoices ADD COLUMN IF NOT EXISTS customer_contact_name TEXT;
ALTER TABLE outgoing_invoices ADD COLUMN IF NOT EXISTS customer_contact_telephone TEXT;
ALTER TABLE outgoing_invoices ADD COLUMN IF NOT EXISTS customer_contact_email TEXT;

-- Payment Information
ALTER TABLE outgoing_invoices ADD COLUMN IF NOT EXISTS payment_means_code TEXT;
ALTER TABLE outgoing_invoices ADD COLUMN IF NOT EXISTS payment_channel_code TEXT;
ALTER TABLE outgoing_invoices ADD COLUMN IF NOT EXISTS payee_iban TEXT;
ALTER TABLE outgoing_invoices ADD COLUMN IF NOT EXISTS payee_bank_name TEXT;
ALTER TABLE outgoing_invoices ADD COLUMN IF NOT EXISTS payment_terms_note TEXT;

-- Invoice Extended Details
ALTER TABLE outgoing_invoices ADD COLUMN IF NOT EXISTS invoice_time TEXT;
ALTER TABLE outgoing_invoices ADD COLUMN IF NOT EXISTS invoice_note TEXT;
ALTER TABLE outgoing_invoices ADD COLUMN IF NOT EXISTS line_extension_amount NUMERIC(15,2);
ALTER TABLE outgoing_invoices ADD COLUMN IF NOT EXISTS total_discount_amount NUMERIC(15,2);

-- Add comments for documentation
COMMENT ON COLUMN outgoing_invoices.supplier_name IS 'Faturayı kesen firma adı (AccountingSupplierParty)';
COMMENT ON COLUMN outgoing_invoices.supplier_tax_number IS 'Faturayı kesen firma VKN/TCKN';
COMMENT ON COLUMN outgoing_invoices.supplier_tax_office IS 'Tedarikçi vergi dairesi';
COMMENT ON COLUMN outgoing_invoices.customer_tax_office IS 'Müşteri vergi dairesi';
COMMENT ON COLUMN outgoing_invoices.payment_means_code IS 'Ödeme şekli kodu (örn: 42 = Banka transferi)';
COMMENT ON COLUMN outgoing_invoices.payee_iban IS 'Ödeme yapılacak IBAN';
COMMENT ON COLUMN outgoing_invoices.invoice_time IS 'Fatura düzenleme saati (HH:MM:SS)';
COMMENT ON COLUMN outgoing_invoices.line_extension_amount IS 'İndirim öncesi toplam tutar';
COMMENT ON COLUMN outgoing_invoices.total_discount_amount IS 'Toplam indirim tutarı';

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Successfully added % new columns to outgoing_invoices table', 26;
END $$;

