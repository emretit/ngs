-- Migration: Rename tenant_id to company_id in leave tables
-- Diğer tablolarla tutarlı olması için tenant_id -> company_id

-- Step 1: leave_types tablosu
ALTER TABLE leave_types 
  RENAME COLUMN tenant_id TO company_id;

-- Step 2: leave_type_rules tablosu
ALTER TABLE leave_type_rules 
  RENAME COLUMN tenant_id TO company_id;

-- Step 3: leave_settings tablosu
ALTER TABLE leave_settings 
  RENAME COLUMN tenant_id TO company_id;

-- Step 4: Foreign key ve unique constraint'leri güncelle (varsa)
-- leave_types unique constraint
ALTER TABLE leave_types DROP CONSTRAINT IF EXISTS leave_types_tenant_id_name_key;
CREATE UNIQUE INDEX leave_types_company_id_name_key ON leave_types(company_id, name);

-- Step 5: Indexleri yeniden oluştur
DROP INDEX IF EXISTS idx_leave_types_tenant_id;
DROP INDEX IF EXISTS idx_leave_type_rules_tenant_id;
DROP INDEX IF EXISTS idx_leave_settings_tenant_id;

CREATE INDEX idx_leave_types_company_id ON leave_types(company_id);
CREATE INDEX idx_leave_type_rules_company_id ON leave_type_rules(company_id);
CREATE INDEX idx_leave_settings_company_id ON leave_settings(company_id);

-- Step 6: RLS Policy'leri güncelle - leave_types
DROP POLICY IF EXISTS "Users can view leave types in their company" ON leave_types;
DROP POLICY IF EXISTS "Admins can insert leave types" ON leave_types;
DROP POLICY IF EXISTS "Admins can update leave types" ON leave_types;
DROP POLICY IF EXISTS "Admins can delete leave types" ON leave_types;

CREATE POLICY "Users can view leave types in their company"
  ON leave_types FOR SELECT
  USING (company_id = current_company_id());

CREATE POLICY "Users can insert leave types"
  ON leave_types FOR INSERT
  WITH CHECK (company_id = current_company_id());

CREATE POLICY "Users can update leave types"
  ON leave_types FOR UPDATE
  USING (company_id = current_company_id())
  WITH CHECK (company_id = current_company_id());

CREATE POLICY "Users can delete leave types"
  ON leave_types FOR DELETE
  USING (company_id = current_company_id());

-- Step 7: RLS Policy'leri güncelle - leave_type_rules
DROP POLICY IF EXISTS "Users can view leave type rules in their company" ON leave_type_rules;
DROP POLICY IF EXISTS "Users can insert leave type rules" ON leave_type_rules;
DROP POLICY IF EXISTS "Users can update leave type rules" ON leave_type_rules;
DROP POLICY IF EXISTS "Users can delete leave type rules" ON leave_type_rules;

CREATE POLICY "Users can view leave type rules in their company"
  ON leave_type_rules FOR SELECT
  USING (company_id = current_company_id());

CREATE POLICY "Users can insert leave type rules"
  ON leave_type_rules FOR INSERT
  WITH CHECK (company_id = current_company_id());

CREATE POLICY "Users can update leave type rules"
  ON leave_type_rules FOR UPDATE
  USING (company_id = current_company_id())
  WITH CHECK (company_id = current_company_id());

CREATE POLICY "Users can delete leave type rules"
  ON leave_type_rules FOR DELETE
  USING (company_id = current_company_id());

-- Step 8: RLS Policy'leri güncelle - leave_settings
DROP POLICY IF EXISTS "Users can view leave settings in their company" ON leave_settings;
DROP POLICY IF EXISTS "Admins can insert leave settings" ON leave_settings;
DROP POLICY IF EXISTS "Admins can update leave settings" ON leave_settings;

CREATE POLICY "Users can view leave settings in their company"
  ON leave_settings FOR SELECT
  USING (company_id = current_company_id());

CREATE POLICY "Users can insert leave settings"
  ON leave_settings FOR INSERT
  WITH CHECK (company_id = current_company_id());

CREATE POLICY "Users can update leave settings"
  ON leave_settings FOR UPDATE
  USING (company_id = current_company_id())
  WITH CHECK (company_id = current_company_id());

-- Step 9: Trigger fonksiyonlarını güncelle
CREATE OR REPLACE FUNCTION create_default_leave_types_for_company()
RETURNS TRIGGER AS $$
BEGIN
  -- Yıllık İzin
  INSERT INTO leave_types (company_id, name, description, is_active, color)
  VALUES (NEW.id, 'Yıllık İzin', 'Çalışma süresine göre hak edilen yıllık izinler', true, '#10b981');

  -- Mazeret İzni
  INSERT INTO leave_types (company_id, name, description, is_active, color)
  VALUES (NEW.id, 'Mazeret İzni', 'Kısa süreli mazeret izinleri', true, '#f59e0b');

  -- Raporlu İzin
  INSERT INTO leave_types (company_id, name, description, is_active, color)
  VALUES (NEW.id, 'Raporlu İzin', 'Sağlık raporu ile alınan izinler', true, '#ef4444');

  -- Ücretsiz İzin
  INSERT INTO leave_types (company_id, name, description, is_active, color)
  VALUES (NEW.id, 'Ücretsiz İzin', 'Ücret kesintisi ile verilen izinler', true, '#6366f1');

  -- Resmî İzin
  INSERT INTO leave_types (company_id, name, description, is_active, color)
  VALUES (NEW.id, 'Resmî İzin', 'Resmi tatiller ve özel günler', true, '#8b5cf6');

  -- Diğer
  INSERT INTO leave_types (company_id, name, description, is_active, color)
  VALUES (NEW.id, 'Diğer', 'Diğer izin türleri', true, '#64748b');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 10: Kural oluşturma fonksiyonunu güncelle
CREATE OR REPLACE FUNCTION create_default_leave_type_rules_for_company()
RETURNS TRIGGER AS $$
DECLARE
  annual_leave_type_id UUID;
BEGIN
  -- Yeni eklenen şirketin "Yıllık İzin" türünü bul
  SELECT id INTO annual_leave_type_id
  FROM leave_types
  WHERE company_id = NEW.company_id
    AND name = 'Yıllık İzin'
  LIMIT 1;
  
  -- Eğer yıllık izin türü varsa kuralları ekle
  IF annual_leave_type_id IS NOT NULL THEN
    
    -- Kural 1: 1-5 yıl arası
    INSERT INTO leave_type_rules (
      company_id, leave_type_id, name, min_years_of_service, 
      max_years_of_service, days_entitled, description, priority
    )
    VALUES (
      NEW.company_id, annual_leave_type_id, '1-5 Yıl Arası Çalışanlar',
      0, 5, 14, 
      'İşe yeni başlayan çalışanlar ve 1-5 yıl arası çalışma süresine sahip olanlar için 14 gün yıllık izin hakkı',
      1
    );
    
    -- Kural 2: 5-15 yıl arası
    INSERT INTO leave_type_rules (
      company_id, leave_type_id, name, min_years_of_service,
      max_years_of_service, days_entitled, description, priority
    )
    VALUES (
      NEW.company_id, annual_leave_type_id, '5-15 Yıl Arası Çalışanlar',
      5, 15, 20,
      '5-15 yıl arası çalışma süresine sahip çalışanlar için 20 gün yıllık izin hakkı',
      2
    );
    
    -- Kural 3: 15+ yıl
    INSERT INTO leave_type_rules (
      company_id, leave_type_id, name, min_years_of_service,
      max_years_of_service, days_entitled, description, priority
    )
    VALUES (
      NEW.company_id, annual_leave_type_id, '15 Yıl ve Üzeri Çalışanlar',
      15, NULL, 26,
      '15 yıl ve üzeri çalışma süresine sahip deneyimli çalışanlar için 26 gün yıllık izin hakkı',
      3
    );
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Yorum: tenant_id -> company_id değişikliği tamamlandı
-- Tüm tablolar, indexler, RLS policy'ler ve fonksiyonlar güncellendi
