-- ==========================================
-- PURCHASING MODULE - MVP TABLES
-- Reuses: companies, profiles, employees, departments, approvals, audit_logs
-- Creates: vendors, vendor_contacts, purchase_requests, purchase_request_items,
--          rfqs, rfq_vendors, rfq_lines, rfq_quotes, rfq_quote_lines,
--          purchase_orders, purchase_order_lines, grns, grn_lines,
--          vendor_invoices, vendor_invoice_lines
-- ==========================================

-- ============= VENDORS =============
CREATE TABLE IF NOT EXISTS public.vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  code TEXT,
  name TEXT NOT NULL,
  tax_number TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  country TEXT DEFAULT 'Turkey',
  currency TEXT DEFAULT 'TRY',
  payment_terms TEXT,
  payment_terms_days INTEGER DEFAULT 30,
  rating INTEGER DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  incoterm TEXT,
  delivery_lead_days INTEGER,
  tags JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  UNIQUE(company_id, code)
);

CREATE INDEX IF NOT EXISTS idx_vendors_company_id ON public.vendors(company_id);
CREATE INDEX IF NOT EXISTS idx_vendors_is_active ON public.vendors(is_active);

-- ============= VENDOR CONTACTS =============
CREATE TABLE IF NOT EXISTS public.vendor_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT,
  is_primary BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vendor_contacts_vendor_id ON public.vendor_contacts(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_contacts_company_id ON public.vendor_contacts(company_id);

-- ============= PURCHASE REQUESTS =============
CREATE TABLE IF NOT EXISTS public.purchase_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  request_number TEXT NOT NULL,
  requester_id UUID REFERENCES public.profiles(id),
  department_id UUID REFERENCES public.departments(id),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected', 'converted')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  need_by_date DATE,
  requester_notes TEXT,
  cost_center TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  UNIQUE(company_id, request_number)
);

CREATE INDEX IF NOT EXISTS idx_purchase_requests_company_id ON public.purchase_requests(company_id);
CREATE INDEX IF NOT EXISTS idx_purchase_requests_status ON public.purchase_requests(status);
CREATE INDEX IF NOT EXISTS idx_purchase_requests_requester_id ON public.purchase_requests(requester_id);

-- ============= PURCHASE REQUEST ITEMS =============
CREATE TABLE IF NOT EXISTS public.purchase_request_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.purchase_requests(id) ON DELETE CASCADE,
  product_id UUID,
  description TEXT NOT NULL,
  quantity NUMERIC(18,3) NOT NULL,
  uom TEXT DEFAULT 'adet',
  estimated_price NUMERIC(18,2),
  currency TEXT DEFAULT 'TRY',
  cost_center TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_purchase_request_items_request_id ON public.purchase_request_items(request_id);

-- ============= RFQs =============
CREATE TABLE IF NOT EXISTS public.rfqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  rfq_number TEXT NOT NULL,
  pr_id UUID REFERENCES public.purchase_requests(id),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'received', 'closed', 'cancelled')),
  due_date DATE,
  incoterm TEXT,
  currency TEXT DEFAULT 'TRY',
  notes TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  UNIQUE(company_id, rfq_number)
);

CREATE INDEX IF NOT EXISTS idx_rfqs_company_id ON public.rfqs(company_id);
CREATE INDEX IF NOT EXISTS idx_rfqs_status ON public.rfqs(status);
CREATE INDEX IF NOT EXISTS idx_rfqs_pr_id ON public.rfqs(pr_id);

-- ============= RFQ VENDORS =============
CREATE TABLE IF NOT EXISTS public.rfq_vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id UUID NOT NULL REFERENCES public.rfqs(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'quoted', 'declined', 'no_response')),
  invited_at TIMESTAMPTZ DEFAULT now(),
  responded_at TIMESTAMPTZ,
  UNIQUE(rfq_id, vendor_id)
);

CREATE INDEX IF NOT EXISTS idx_rfq_vendors_rfq_id ON public.rfq_vendors(rfq_id);
CREATE INDEX IF NOT EXISTS idx_rfq_vendors_vendor_id ON public.rfq_vendors(vendor_id);

-- ============= RFQ LINES =============
CREATE TABLE IF NOT EXISTS public.rfq_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id UUID NOT NULL REFERENCES public.rfqs(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  product_id UUID,
  description TEXT NOT NULL,
  quantity NUMERIC(18,3) NOT NULL,
  uom TEXT DEFAULT 'adet',
  target_price NUMERIC(18,2),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rfq_lines_rfq_id ON public.rfq_lines(rfq_id);

-- ============= RFQ QUOTES =============
CREATE TABLE IF NOT EXISTS public.rfq_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id UUID NOT NULL REFERENCES public.rfqs(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  quote_number TEXT,
  currency TEXT DEFAULT 'TRY',
  exchange_rate NUMERIC(18,6) DEFAULT 1,
  valid_until DATE,
  delivery_days INTEGER,
  shipping_cost NUMERIC(18,2) DEFAULT 0,
  discount_rate NUMERIC(6,3) DEFAULT 0,
  payment_terms TEXT,
  notes TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  subtotal NUMERIC(18,2) DEFAULT 0,
  tax_total NUMERIC(18,2) DEFAULT 0,
  grand_total NUMERIC(18,2) DEFAULT 0,
  is_selected BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rfq_quotes_rfq_id ON public.rfq_quotes(rfq_id);
CREATE INDEX IF NOT EXISTS idx_rfq_quotes_vendor_id ON public.rfq_quotes(vendor_id);

-- ============= RFQ QUOTE LINES =============
CREATE TABLE IF NOT EXISTS public.rfq_quote_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_quote_id UUID NOT NULL REFERENCES public.rfq_quotes(id) ON DELETE CASCADE,
  rfq_line_id UUID NOT NULL REFERENCES public.rfq_lines(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  unit_price NUMERIC(18,4) NOT NULL,
  tax_rate NUMERIC(5,2) DEFAULT 20,
  discount_rate NUMERIC(6,3) DEFAULT 0,
  line_total NUMERIC(18,2) DEFAULT 0,
  delivery_days INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rfq_quote_lines_quote_id ON public.rfq_quote_lines(rfq_quote_id);
CREATE INDEX IF NOT EXISTS idx_rfq_quote_lines_line_id ON public.rfq_quote_lines(rfq_line_id);

-- ============= PURCHASE ORDERS =============
CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  order_number TEXT NOT NULL,
  request_id UUID REFERENCES public.purchase_requests(id),
  supplier_id UUID REFERENCES public.vendors(id),
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_delivery_date DATE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'confirmed', 'partial_received', 'received', 'cancelled')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  payment_terms TEXT,
  delivery_address TEXT,
  notes TEXT,
  subtotal NUMERIC(18,2) DEFAULT 0,
  tax_total NUMERIC(18,2) DEFAULT 0,
  total_amount NUMERIC(18,2) DEFAULT 0,
  currency TEXT DEFAULT 'TRY',
  created_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id),
  UNIQUE(company_id, order_number)
);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_company_id ON public.purchase_orders(company_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON public.purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier_id ON public.purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_request_id ON public.purchase_orders(request_id);

-- ============= PURCHASE ORDER LINES =============
CREATE TABLE IF NOT EXISTS public.purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  product_id UUID,
  description TEXT NOT NULL,
  quantity NUMERIC(18,3) NOT NULL,
  unit_price NUMERIC(18,4) DEFAULT 0,
  tax_rate NUMERIC(5,2) DEFAULT 20,
  discount_rate NUMERIC(6,3) DEFAULT 0,
  line_total NUMERIC(18,2) DEFAULT 0,
  uom TEXT DEFAULT 'adet',
  notes TEXT,
  received_quantity NUMERIC(18,3) DEFAULT 0,
  invoiced_quantity NUMERIC(18,3) DEFAULT 0,
  cost_center TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_purchase_order_items_order_id ON public.purchase_order_items(order_id);

-- ============= GRNs (Goods Receipt Notes) =============
CREATE TABLE IF NOT EXISTS public.grns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  grn_number TEXT NOT NULL,
  po_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('draft', 'received', 'putaway', 'returned', 'cancelled')),
  received_date DATE NOT NULL DEFAULT CURRENT_DATE,
  received_by UUID REFERENCES public.profiles(id),
  warehouse_id UUID,
  notes TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  UNIQUE(company_id, grn_number)
);

CREATE INDEX IF NOT EXISTS idx_grns_company_id ON public.grns(company_id);
CREATE INDEX IF NOT EXISTS idx_grns_status ON public.grns(status);
CREATE INDEX IF NOT EXISTS idx_grns_po_id ON public.grns(po_id);

-- ============= GRN LINES =============
CREATE TABLE IF NOT EXISTS public.grn_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grn_id UUID NOT NULL REFERENCES public.grns(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  po_line_id UUID NOT NULL REFERENCES public.purchase_order_items(id) ON DELETE CASCADE,
  received_quantity NUMERIC(18,3) NOT NULL,
  qc_status TEXT NOT NULL DEFAULT 'accepted' CHECK (qc_status IN ('accepted', 'rework', 'rejected')),
  location_id UUID,
  serials JSONB DEFAULT '[]'::jsonb,
  batches JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_grn_lines_grn_id ON public.grn_lines(grn_id);
CREATE INDEX IF NOT EXISTS idx_grn_lines_po_line_id ON public.grn_lines(po_line_id);

-- ============= VENDOR INVOICES =============
CREATE TABLE IF NOT EXISTS public.vendor_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  invoice_date DATE NOT NULL,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  po_id UUID REFERENCES public.purchase_orders(id),
  grn_id UUID REFERENCES public.grns(id),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'matched', 'approved', 'posted', 'paid', 'void')),
  currency TEXT DEFAULT 'TRY',
  exchange_rate NUMERIC(18,6) DEFAULT 1,
  subtotal NUMERIC(18,2) DEFAULT 0,
  tax_total NUMERIC(18,2) DEFAULT 0,
  grand_total NUMERIC(18,2) DEFAULT 0,
  paid_amount NUMERIC(18,2) DEFAULT 0,
  due_date DATE,
  payment_terms TEXT,
  e_invoice_uuid TEXT,
  match_status TEXT DEFAULT 'unmatched' CHECK (match_status IN ('unmatched', 'matched', 'discrepancy', 'over_billed')),
  notes TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  posted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id),
  UNIQUE(company_id, invoice_number)
);

CREATE INDEX IF NOT EXISTS idx_vendor_invoices_company_id ON public.vendor_invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_vendor_invoices_status ON public.vendor_invoices(status);
CREATE INDEX IF NOT EXISTS idx_vendor_invoices_vendor_id ON public.vendor_invoices(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_invoices_po_id ON public.vendor_invoices(po_id);
CREATE INDEX IF NOT EXISTS idx_vendor_invoices_grn_id ON public.vendor_invoices(grn_id);

-- ============= VENDOR INVOICE LINES =============
CREATE TABLE IF NOT EXISTS public.vendor_invoice_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_invoice_id UUID NOT NULL REFERENCES public.vendor_invoices(id) ON DELETE CASCADE,
  po_line_id UUID REFERENCES public.purchase_order_items(id),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  product_id UUID,
  description TEXT NOT NULL,
  quantity NUMERIC(18,3) NOT NULL,
  uom TEXT DEFAULT 'adet',
  unit_price NUMERIC(18,4) NOT NULL,
  tax_rate NUMERIC(5,2) DEFAULT 20,
  discount_rate NUMERIC(6,3) DEFAULT 0,
  line_total NUMERIC(18,2) DEFAULT 0,
  match_status TEXT DEFAULT 'unmatched' CHECK (match_status IN ('matched', 'qty_mismatch', 'price_mismatch', 'unmatched')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vendor_invoice_lines_invoice_id ON public.vendor_invoice_lines(vendor_invoice_id);
CREATE INDEX IF NOT EXISTS idx_vendor_invoice_lines_po_line_id ON public.vendor_invoice_lines(po_line_id);

-- ============= DOCUMENT NUMBER GENERATOR =============
CREATE OR REPLACE FUNCTION public.generate_document_number(
  p_company_id UUID,
  p_doc_type TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_year TEXT;
  v_prefix TEXT;
  v_next_num INTEGER;
  v_doc_number TEXT;
  v_table_name TEXT;
  v_column_name TEXT;
BEGIN
  v_year := TO_CHAR(CURRENT_DATE, 'YYYY');
  
  -- Determine prefix and table
  CASE p_doc_type
    WHEN 'PR' THEN
      v_prefix := 'PR-' || v_year || '-';
      v_table_name := 'purchase_requests';
      v_column_name := 'request_number';
    WHEN 'RFQ' THEN
      v_prefix := 'RFQ-' || v_year || '-';
      v_table_name := 'rfqs';
      v_column_name := 'rfq_number';
    WHEN 'PO' THEN
      v_prefix := 'PO-' || v_year || '-';
      v_table_name := 'purchase_orders';
      v_column_name := 'order_number';
    WHEN 'GRN' THEN
      v_prefix := 'GRN-' || v_year || '-';
      v_table_name := 'grns';
      v_column_name := 'grn_number';
    WHEN 'INV' THEN
      v_prefix := 'INV-' || v_year || '-';
      v_table_name := 'vendor_invoices';
      v_column_name := 'invoice_number';
    ELSE
      RAISE EXCEPTION 'Invalid document type: %', p_doc_type;
  END CASE;
  
  -- Get next number with row locking
  EXECUTE format(
    'SELECT COALESCE(MAX(CAST(SUBSTRING(%I FROM %s) AS INTEGER)), 0) + 1
     FROM %I
     WHERE company_id = $1 AND %I LIKE $2
     FOR UPDATE',
    v_column_name,
    LENGTH(v_prefix) + 1,
    v_table_name,
    v_column_name
  ) INTO v_next_num
  USING p_company_id, v_prefix || '%';
  
  v_doc_number := v_prefix || LPAD(v_next_num::TEXT, 4, '0');
  
  RETURN v_doc_number;
END;
$$;

-- ============= RLS POLICIES =============

-- Vendors
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company-based vendors access"
ON public.vendors
FOR ALL
TO authenticated
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- Vendor Contacts
ALTER TABLE public.vendor_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company-based vendor contacts access"
ON public.vendor_contacts
FOR ALL
TO authenticated
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- Purchase Requests
ALTER TABLE public.purchase_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company-based purchase requests access"
ON public.purchase_requests
FOR ALL
TO authenticated
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- Purchase Request Items
ALTER TABLE public.purchase_request_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company-based PR items access"
ON public.purchase_request_items
FOR ALL
TO authenticated
USING (request_id IN (SELECT id FROM purchase_requests WHERE company_id = current_company_id()))
WITH CHECK (request_id IN (SELECT id FROM purchase_requests WHERE company_id = current_company_id()));

-- RFQs
ALTER TABLE public.rfqs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company-based rfqs access"
ON public.rfqs
FOR ALL
TO authenticated
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- RFQ Vendors
ALTER TABLE public.rfq_vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company-based rfq vendors access"
ON public.rfq_vendors
FOR ALL
TO authenticated
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- RFQ Lines
ALTER TABLE public.rfq_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company-based rfq lines access"
ON public.rfq_lines
FOR ALL
TO authenticated
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- RFQ Quotes
ALTER TABLE public.rfq_quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company-based rfq quotes access"
ON public.rfq_quotes
FOR ALL
TO authenticated
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- RFQ Quote Lines
ALTER TABLE public.rfq_quote_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company-based rfq quote lines access"
ON public.rfq_quote_lines
FOR ALL
TO authenticated
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- Purchase Orders
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company-based purchase orders access"
ON public.purchase_orders
FOR ALL
TO authenticated
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- Purchase Order Items
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company-based PO items access"
ON public.purchase_order_items
FOR ALL
TO authenticated
USING (order_id IN (SELECT id FROM purchase_orders WHERE company_id = current_company_id()))
WITH CHECK (order_id IN (SELECT id FROM purchase_orders WHERE company_id = current_company_id()));

-- GRNs
ALTER TABLE public.grns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company-based grns access"
ON public.grns
FOR ALL
TO authenticated
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- GRN Lines
ALTER TABLE public.grn_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company-based grn lines access"
ON public.grn_lines
FOR ALL
TO authenticated
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- Vendor Invoices
ALTER TABLE public.vendor_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company-based vendor invoices access"
ON public.vendor_invoices
FOR ALL
TO authenticated
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());

-- Vendor Invoice Lines
ALTER TABLE public.vendor_invoice_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company-based vendor invoice lines access"
ON public.vendor_invoice_lines
FOR ALL
TO authenticated
USING (company_id = current_company_id())
WITH CHECK (company_id = current_company_id());