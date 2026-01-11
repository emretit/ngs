-- =====================================================
-- PAYROLL AUTOMATION SYSTEM
-- =====================================================
-- Bu migration aylık otomatik bordro oluşturma ve 
-- Finance modülü entegrasyonu için gerekli tabloları
-- ve güncellemeleri içerir.
-- =====================================================

-- =====================================================
-- 1. payroll_runs Tablosu Güncellemeleri
-- =====================================================
-- Otomatik bordro oluşturma ve onay workflow'u için
-- yeni kolonlar ekleniyor

ALTER TABLE public.payroll_runs 
  ADD COLUMN IF NOT EXISTS auto_generated BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS finance_sync_status VARCHAR(20) DEFAULT 'pending' 
    CHECK (finance_sync_status IN ('pending', 'synced', 'failed')),
  ADD COLUMN IF NOT EXISTS finance_synced_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) DEFAULT 'pending'
    CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Index ekleme (performans için)
CREATE INDEX IF NOT EXISTS idx_payroll_runs_finance_sync_status 
  ON public.payroll_runs(finance_sync_status);
CREATE INDEX IF NOT EXISTS idx_payroll_runs_approval_status 
  ON public.payroll_runs(approval_status);
CREATE INDEX IF NOT EXISTS idx_payroll_runs_auto_generated 
  ON public.payroll_runs(auto_generated);
CREATE INDEX IF NOT EXISTS idx_payroll_runs_period 
  ON public.payroll_runs(payroll_period_year, payroll_period_month);

COMMENT ON COLUMN public.payroll_runs.auto_generated IS 
  'Bordronun otomatik mi manuel mi oluşturulduğunu belirtir';
COMMENT ON COLUMN public.payroll_runs.finance_sync_status IS 
  'Finance modülüne senkronizasyon durumu: pending, synced, failed';
COMMENT ON COLUMN public.payroll_runs.approval_status IS 
  'Yönetici onay durumu: pending, approved, rejected';

-- =====================================================
-- 2. payroll_finance_entries Tablosu (YENİ)
-- =====================================================
-- Finance modülü entegrasyonu için muhasebe kayıtları
-- Her payroll_item için ayrı ayrı gider kalemleri tutar

CREATE TABLE IF NOT EXISTS public.payroll_finance_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_item_id UUID NOT NULL REFERENCES public.payroll_items(id) ON DELETE CASCADE,
  payroll_run_id UUID NOT NULL REFERENCES public.payroll_runs(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  
  -- Muhasebe Kalemleri (Detaylı Breakdown)
  gross_salary_expense DECIMAL(15,2) NOT NULL DEFAULT 0, -- Brüt maaş gideri
  sgk_employee_deduction DECIMAL(15,2) NOT NULL DEFAULT 0, -- SSK çalışan kesintisi
  sgk_employer_expense DECIMAL(15,2) NOT NULL DEFAULT 0, -- SSK işveren payı gideri
  unemployment_employee_deduction DECIMAL(15,2) NOT NULL DEFAULT 0, -- İşsizlik sigorta çalışan
  unemployment_employer_expense DECIMAL(15,2) NOT NULL DEFAULT 0, -- İşsizlik sigorta işveren
  accident_insurance_expense DECIMAL(15,2) NOT NULL DEFAULT 0, -- İş kazası sigortası
  income_tax_deduction DECIMAL(15,2) NOT NULL DEFAULT 0, -- Gelir vergisi kesintisi
  stamp_tax_deduction DECIMAL(15,2) NOT NULL DEFAULT 0, -- Damga vergisi kesintisi
  net_salary_payable DECIMAL(15,2) NOT NULL DEFAULT 0, -- Ödenecek net maaş
  total_employer_cost DECIMAL(15,2) NOT NULL DEFAULT 0, -- Toplam işveren maliyeti
  
  -- İşlem ve Ödeme Bilgileri
  transaction_date DATE NOT NULL,
  payment_status VARCHAR(20) DEFAULT 'pending' 
    CHECK (payment_status IN ('pending', 'paid', 'cancelled')),
  payment_date DATE,
  payment_method VARCHAR(30),
  
  -- Bank transaction ilişkilendirmesi (ödeme yapılınca doldurulur)
  bank_transaction_id UUID REFERENCES public.bank_transactions(id),
  cash_transaction_id UUID REFERENCES public.cash_transactions(id),
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id),
  
  -- Constraints
  CONSTRAINT valid_payment_status CHECK (
    (payment_status = 'pending' AND payment_date IS NULL) OR
    (payment_status IN ('paid', 'cancelled'))
  )
);

-- RLS Enable
ALTER TABLE public.payroll_finance_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Company-based access)
CREATE POLICY "Company-based access on payroll_finance_entries" 
  ON public.payroll_finance_entries
  FOR ALL TO authenticated
  USING (company_id = current_company_id())
  WITH CHECK (company_id = current_company_id());

-- Indexes (Performance optimization)
CREATE INDEX IF NOT EXISTS idx_payroll_finance_entries_company 
  ON public.payroll_finance_entries(company_id);
CREATE INDEX IF NOT EXISTS idx_payroll_finance_entries_payroll_run 
  ON public.payroll_finance_entries(payroll_run_id);
CREATE INDEX IF NOT EXISTS idx_payroll_finance_entries_payroll_item 
  ON public.payroll_finance_entries(payroll_item_id);
CREATE INDEX IF NOT EXISTS idx_payroll_finance_entries_employee 
  ON public.payroll_finance_entries(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_finance_entries_payment_status 
  ON public.payroll_finance_entries(payment_status);
CREATE INDEX IF NOT EXISTS idx_payroll_finance_entries_transaction_date 
  ON public.payroll_finance_entries(transaction_date);
CREATE INDEX IF NOT EXISTS idx_payroll_finance_entries_bank_transaction 
  ON public.payroll_finance_entries(bank_transaction_id) 
  WHERE bank_transaction_id IS NOT NULL;

-- Updated_at Trigger
CREATE TRIGGER update_payroll_finance_entries_updated_at 
  BEFORE UPDATE ON public.payroll_finance_entries 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

-- Comments
COMMENT ON TABLE public.payroll_finance_entries IS 
  'Bordro Finance entegrasyonu için muhasebe kayıtları. Her çalışanın bordr osu için ayrı ayrı gider kalemleri tutar.';
COMMENT ON COLUMN public.payroll_finance_entries.gross_salary_expense IS 
  'Brüt maaş gideri (muhasebe kaydı)';
COMMENT ON COLUMN public.payroll_finance_entries.sgk_employer_expense IS 
  'SSK işveren payı gideri';
COMMENT ON COLUMN public.payroll_finance_entries.net_salary_payable IS 
  'Çalışana ödenecek net maaş tutarı';
COMMENT ON COLUMN public.payroll_finance_entries.payment_status IS 
  'Ödeme durumu: pending (bekliyor), paid (ödendi), cancelled (iptal)';

-- =====================================================
-- 3. Helper Functions
-- =====================================================

-- Function: Bordro run approval durumunu güncelle
CREATE OR REPLACE FUNCTION public.approve_payroll_run(
  p_payroll_run_id UUID,
  p_approver_id UUID,
  p_approved BOOLEAN DEFAULT TRUE,
  p_rejection_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  IF p_approved THEN
    UPDATE public.payroll_runs
    SET 
      approval_status = 'approved',
      approved_by = p_approver_id,
      approved_at = NOW(),
      updated_at = NOW()
    WHERE id = p_payroll_run_id;
  ELSE
    UPDATE public.payroll_runs
    SET 
      approval_status = 'rejected',
      approved_by = p_approver_id,
      approved_at = NOW(),
      rejection_reason = p_rejection_reason,
      updated_at = NOW()
    WHERE id = p_payroll_run_id;
  END IF;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.approve_payroll_run IS 
  'Bordro run onaylama/reddetme fonksiyonu';

-- Function: Bordro Finance sync durumunu güncelle
CREATE OR REPLACE FUNCTION public.update_payroll_finance_sync_status(
  p_payroll_run_id UUID,
  p_status VARCHAR,
  p_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.payroll_runs
  SET 
    finance_sync_status = p_status,
    finance_synced_at = CASE WHEN p_status = 'synced' THEN p_synced_at ELSE NULL END,
    updated_at = NOW()
  WHERE id = p_payroll_run_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.update_payroll_finance_sync_status IS 
  'Bordro Finance senkronizasyon durumunu günceller';

-- =====================================================
-- 4. Views (Raporlama için)
-- =====================================================

-- View: Aylık bordro özeti (Finance Dashboard için)
CREATE OR REPLACE VIEW public.monthly_payroll_summary AS
SELECT 
  pr.company_id,
  pr.payroll_period_year,
  pr.payroll_period_month,
  pr.status,
  pr.approval_status,
  pr.finance_sync_status,
  COUNT(DISTINCT pi.employee_id) as employee_count,
  SUM(pfe.gross_salary_expense) as total_gross_salary,
  SUM(pfe.sgk_employer_expense + pfe.unemployment_employer_expense + pfe.accident_insurance_expense) as total_employer_taxes,
  SUM(pfe.sgk_employee_deduction + pfe.unemployment_employee_deduction) as total_employee_sgk,
  SUM(pfe.income_tax_deduction + pfe.stamp_tax_deduction) as total_income_taxes,
  SUM(pfe.net_salary_payable) as total_net_payable,
  SUM(pfe.total_employer_cost) as total_employer_cost,
  COUNT(CASE WHEN pfe.payment_status = 'paid' THEN 1 END) as paid_count,
  COUNT(CASE WHEN pfe.payment_status = 'pending' THEN 1 END) as pending_count,
  pr.created_at,
  pr.approved_at
FROM public.payroll_runs pr
LEFT JOIN public.payroll_items pi ON pr.id = pi.payroll_run_id
LEFT JOIN public.payroll_finance_entries pfe ON pi.id = pfe.payroll_item_id
GROUP BY 
  pr.id,
  pr.company_id,
  pr.payroll_period_year,
  pr.payroll_period_month,
  pr.status,
  pr.approval_status,
  pr.finance_sync_status,
  pr.created_at,
  pr.approved_at;

COMMENT ON VIEW public.monthly_payroll_summary IS 
  'Aylık bordro özet raporu - Finance Dashboard için';

-- View: Bekleyen bordro ödemeleri
CREATE OR REPLACE VIEW public.pending_payroll_payments AS
SELECT 
  pfe.id,
  pfe.company_id,
  pfe.employee_id,
  e.first_name,
  e.last_name,
  pr.payroll_period_year,
  pr.payroll_period_month,
  pfe.net_salary_payable,
  pfe.transaction_date,
  pfe.created_at,
  CONCAT(pr.payroll_period_year, '-', LPAD(pr.payroll_period_month::TEXT, 2, '0')) as period
FROM public.payroll_finance_entries pfe
JOIN public.employees e ON pfe.employee_id = e.id
JOIN public.payroll_runs pr ON pfe.payroll_run_id = pr.id
WHERE pfe.payment_status = 'pending'
  AND pr.approval_status = 'approved'
ORDER BY pfe.transaction_date DESC, e.last_name, e.first_name;

COMMENT ON VIEW public.pending_payroll_payments IS 
  'Bekleyen bordro ödemeleri listesi';

-- =====================================================
-- 5. Grants (Permissions)
-- =====================================================

-- View'lara authenticated kullanıcılar erişebilir
GRANT SELECT ON public.monthly_payroll_summary TO authenticated;
GRANT SELECT ON public.pending_payroll_payments TO authenticated;

-- =====================================================
-- Migration tamamlandı
-- =====================================================
