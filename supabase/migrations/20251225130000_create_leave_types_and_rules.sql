-- Create leave_types table (İzin Türleri)
CREATE TABLE IF NOT EXISTS leave_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  color TEXT, -- UI için renk kodu
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, name)
);

-- Create leave_type_rules table (İzin Türü Kuralları)
CREATE TABLE IF NOT EXISTS leave_type_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  leave_type_id UUID NOT NULL REFERENCES leave_types(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- Örn: "1-5 yıl arası", "5-15 yıl arası"
  min_years_of_service INTEGER, -- Minimum çalışma yılı (null = sınırsız)
  max_years_of_service INTEGER, -- Maximum çalışma yılı (null = sınırsız)
  days_entitled INTEGER NOT NULL, -- Hak edilen gün sayısı
  description TEXT,
  priority INTEGER DEFAULT 0, -- Hangi kuralın öncelikli olduğu (düşük numara = yüksek öncelik)
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT valid_years_range CHECK (
    (min_years_of_service IS NULL OR max_years_of_service IS NULL) OR
    (min_years_of_service <= max_years_of_service)
  )
);

-- Create leave_settings table (İzin Ayarları)
CREATE TABLE IF NOT EXISTS leave_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE UNIQUE,
  requires_approval BOOLEAN DEFAULT true,
  approval_model TEXT DEFAULT 'single_manager', -- 'single_manager', 'department_manager', 'specific_user'
  default_approver_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  employee_cannot_approve_own BOOLEAN DEFAULT true,
  max_concurrent_leaves_per_department INTEGER,
  rejection_reason_required BOOLEAN DEFAULT true,
  exclude_holidays BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies for leave_types
ALTER TABLE leave_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view leave types in their company"
  ON leave_types FOR SELECT
  USING (
    tenant_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert leave types"
  ON leave_types FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update leave types"
  ON leave_types FOR UPDATE
  USING (
    tenant_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete leave types"
  ON leave_types FOR DELETE
  USING (
    tenant_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for leave_type_rules
ALTER TABLE leave_type_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view leave type rules in their company"
  ON leave_type_rules FOR SELECT
  USING (
    tenant_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert leave type rules"
  ON leave_type_rules FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update leave type rules"
  ON leave_type_rules FOR UPDATE
  USING (
    tenant_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete leave type rules"
  ON leave_type_rules FOR DELETE
  USING (
    tenant_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for leave_settings
ALTER TABLE leave_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view leave settings in their company"
  ON leave_settings FOR SELECT
  USING (
    tenant_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert leave settings"
  ON leave_settings FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update leave settings"
  ON leave_settings FOR UPDATE
  USING (
    tenant_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Insert default leave types (Varsayılan izin türleri)
-- Not: Bu insert'ler sadece örnektir, gerçek uygulamada her şirket kendi izin türlerini oluşturmalı

-- Create indexes for better performance
CREATE INDEX idx_leave_types_tenant_id ON leave_types(tenant_id);
CREATE INDEX idx_leave_type_rules_tenant_id ON leave_type_rules(tenant_id);
CREATE INDEX idx_leave_type_rules_leave_type_id ON leave_type_rules(leave_type_id);
CREATE INDEX idx_leave_settings_tenant_id ON leave_settings(tenant_id);

-- Add updated_at trigger for leave_types
CREATE TRIGGER update_leave_types_updated_at
  BEFORE UPDATE ON leave_types
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add updated_at trigger for leave_type_rules
CREATE TRIGGER update_leave_type_rules_updated_at
  BEFORE UPDATE ON leave_type_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add updated_at trigger for leave_settings
CREATE TRIGGER update_leave_settings_updated_at
  BEFORE UPDATE ON leave_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
