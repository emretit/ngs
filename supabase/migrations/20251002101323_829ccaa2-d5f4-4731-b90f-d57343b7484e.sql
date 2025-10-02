-- SPRINT 1: Purchase Requests + Approval Workflow
-- Satın alma modülü temel altyapısı

-- 1. purchase_requests tablosunu güncelle (mevcut tabloya yeni kolonlar)
ALTER TABLE purchase_requests
  ADD COLUMN IF NOT EXISTS priority text CHECK (priority IN ('low', 'normal', 'high', 'urgent')) DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS cost_center text,
  ADD COLUMN IF NOT EXISTS need_by_date timestamptz,
  ADD COLUMN IF NOT EXISTS requester_notes text,
  ADD COLUMN IF NOT EXISTS department_id uuid REFERENCES departments(id);

-- 2. approvals tablosu (basit onay akışı)
CREATE TABLE IF NOT EXISTS approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  object_type text NOT NULL, -- 'purchase_request', 'purchase_order', etc.
  object_id uuid NOT NULL,
  step integer DEFAULT 1,
  approver_id uuid REFERENCES profiles(id),
  status text CHECK (status IN ('pending', 'approved', 'rejected', 'skipped')) DEFAULT 'pending',
  decided_at timestamptz,
  comment text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. purchasing_settings tablosu (numbering, thresholds, defaults)
CREATE TABLE IF NOT EXISTS purchasing_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid UNIQUE REFERENCES companies(id) ON DELETE CASCADE,
  pr_prefix text DEFAULT 'PR',
  po_prefix text DEFAULT 'PO',
  rfq_prefix text DEFAULT 'RFQ',
  grn_prefix text DEFAULT 'GRN',
  approval_threshold_level1 numeric(18,2) DEFAULT 50000, -- 50K TRY
  approval_threshold_level2 numeric(18,2) DEFAULT 100000, -- 100K TRY
  default_tax_rate numeric(5,2) DEFAULT 20, -- KDV %20
  default_currency text DEFAULT 'TRY',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. Indexes (performans için)
CREATE INDEX IF NOT EXISTS idx_approvals_object ON approvals(object_type, object_id, status);
CREATE INDEX IF NOT EXISTS idx_approvals_company ON approvals(company_id, status);
CREATE INDEX IF NOT EXISTS idx_pr_status_company ON purchase_requests(status, company_id);
CREATE INDEX IF NOT EXISTS idx_pr_priority ON purchase_requests(priority, need_by_date);

-- 5. RLS Policies
ALTER TABLE approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchasing_settings ENABLE ROW LEVEL SECURITY;

-- Company-based access for approvals
CREATE POLICY "Company-based access" ON approvals
  FOR ALL USING (company_id = current_company_id())
  WITH CHECK (company_id = current_company_id());

-- Company-based access for settings
CREATE POLICY "Company-based access" ON purchasing_settings
  FOR ALL USING (company_id = current_company_id())
  WITH CHECK (company_id = current_company_id());

-- 6. Helper function: Auto-generate approval steps
CREATE OR REPLACE FUNCTION create_approval_workflow(
  p_company_id uuid,
  p_object_type text,
  p_object_id uuid,
  p_amount numeric DEFAULT 0
) RETURNS void AS $$
DECLARE
  v_threshold1 numeric;
  v_threshold2 numeric;
BEGIN
  -- Get thresholds
  SELECT approval_threshold_level1, approval_threshold_level2
  INTO v_threshold1, v_threshold2
  FROM purchasing_settings
  WHERE company_id = p_company_id;

  -- Level 1 approval (always required)
  INSERT INTO approvals (company_id, object_type, object_id, step, status)
  VALUES (p_company_id, p_object_type, p_object_id, 1, 'pending');

  -- Level 2 approval (if amount exceeds threshold)
  IF p_amount >= COALESCE(v_threshold1, 50000) THEN
    INSERT INTO approvals (company_id, object_type, object_id, step, status)
    VALUES (p_company_id, p_object_type, p_object_id, 2, 'pending');
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Trigger: Auto-create approval workflow on PR submit
CREATE OR REPLACE FUNCTION trigger_pr_approval_workflow()
RETURNS TRIGGER AS $$
BEGIN
  -- When status changes from 'draft' to 'submitted'
  IF OLD.status = 'draft' AND NEW.status = 'submitted' THEN
    PERFORM create_approval_workflow(
      NEW.company_id,
      'purchase_request',
      NEW.id,
      (SELECT COALESCE(SUM(quantity * estimated_price), 0) 
       FROM purchase_request_items 
       WHERE request_id = NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pr_approval_trigger
  AFTER UPDATE ON purchase_requests
  FOR EACH ROW
  EXECUTE FUNCTION trigger_pr_approval_workflow();

COMMENT ON TABLE approvals IS 'Multi-level approval workflow for purchasing documents';
COMMENT ON TABLE purchasing_settings IS 'Company-specific purchasing module settings';
COMMENT ON FUNCTION create_approval_workflow IS 'Auto-generates approval steps based on amount thresholds';