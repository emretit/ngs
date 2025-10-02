-- Auto-numbering triggers for purchasing documents

-- Trigger for Purchase Requests (PR)
CREATE OR REPLACE FUNCTION assign_pr_number()
RETURNS TRIGGER AS $$
BEGIN
  -- Only assign number when status changes to 'submitted' and number is not already set
  IF NEW.status = 'submitted' AND (NEW.request_number IS NULL OR NEW.request_number = '') THEN
    NEW.request_number := generate_document_number(NEW.company_id, 'PR');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_assign_pr_number
BEFORE INSERT OR UPDATE ON purchase_requests
FOR EACH ROW
EXECUTE FUNCTION assign_pr_number();

-- Trigger for RFQs
CREATE OR REPLACE FUNCTION assign_rfq_number()
RETURNS TRIGGER AS $$
BEGIN
  -- Assign number when status changes to 'sent' and number is not already set
  IF NEW.status = 'sent' AND (NEW.rfq_number IS NULL OR NEW.rfq_number = '') THEN
    NEW.rfq_number := generate_document_number(NEW.company_id, 'RFQ');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_assign_rfq_number
BEFORE INSERT OR UPDATE ON rfqs
FOR EACH ROW
EXECUTE FUNCTION assign_rfq_number();

-- Trigger for Purchase Orders (PO)
CREATE OR REPLACE FUNCTION assign_po_number()
RETURNS TRIGGER AS $$
BEGIN
  -- Assign number when status changes to 'submitted' and number is not already set
  IF NEW.status = 'submitted' AND (NEW.order_number IS NULL OR NEW.order_number = '') THEN
    NEW.order_number := generate_document_number(NEW.company_id, 'PO');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_assign_po_number
BEFORE INSERT OR UPDATE ON purchase_orders
FOR EACH ROW
EXECUTE FUNCTION assign_po_number();

-- Trigger for GRNs
CREATE OR REPLACE FUNCTION assign_grn_number()
RETURNS TRIGGER AS $$
BEGIN
  -- Assign number on insert if not already set
  IF (TG_OP = 'INSERT' OR NEW.status = 'completed') AND (NEW.grn_number IS NULL OR NEW.grn_number = '') THEN
    NEW.grn_number := generate_document_number(NEW.company_id, 'GRN');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_assign_grn_number
BEFORE INSERT OR UPDATE ON grns
FOR EACH ROW
EXECUTE FUNCTION assign_grn_number();

-- Trigger for Vendor Invoices (INV)
CREATE OR REPLACE FUNCTION assign_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
  -- Assign number when status changes to 'matched' or 'approved' and number is not already set
  IF (NEW.status IN ('matched', 'approved', 'posted')) AND (NEW.invoice_number IS NULL OR NEW.invoice_number = '') THEN
    NEW.invoice_number := generate_document_number(NEW.company_id, 'INV');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_assign_invoice_number
BEFORE INSERT OR UPDATE ON vendor_invoices
FOR EACH ROW
EXECUTE FUNCTION assign_invoice_number();