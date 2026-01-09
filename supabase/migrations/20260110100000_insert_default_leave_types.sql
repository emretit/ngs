-- Migration: Insert default leave types for existing companies
-- Bu migration, mevcut tüm şirketler için standart izin türlerini oluşturur

-- Mevcut şirketler için standart izin türlerini ekle
DO $$
DECLARE
  company_record RECORD;
BEGIN
  -- Her şirket için standart izin türlerini ekle
  FOR company_record IN SELECT id FROM companies LOOP
    -- Yıllık İzin
    INSERT INTO leave_types (tenant_id, name, description, is_active, color)
    VALUES (
      company_record.id,
      'Yıllık İzin',
      'Çalışma süresine göre hak edilen yıllık izinler',
      true,
      '#10b981'
    )
    ON CONFLICT (tenant_id, name) DO NOTHING;

    -- Mazeret İzni
    INSERT INTO leave_types (tenant_id, name, description, is_active, color)
    VALUES (
      company_record.id,
      'Mazeret İzni',
      'Kısa süreli mazeret izinleri',
      true,
      '#f59e0b'
    )
    ON CONFLICT (tenant_id, name) DO NOTHING;

    -- Raporlu İzin
    INSERT INTO leave_types (tenant_id, name, description, is_active, color)
    VALUES (
      company_record.id,
      'Raporlu İzin',
      'Sağlık raporu ile alınan izinler',
      true,
      '#ef4444'
    )
    ON CONFLICT (tenant_id, name) DO NOTHING;

    -- Ücretsiz İzin
    INSERT INTO leave_types (tenant_id, name, description, is_active, color)
    VALUES (
      company_record.id,
      'Ücretsiz İzin',
      'Ücret kesintisi ile verilen izinler',
      true,
      '#6366f1'
    )
    ON CONFLICT (tenant_id, name) DO NOTHING;

    -- Resmî İzin
    INSERT INTO leave_types (tenant_id, name, description, is_active, color)
    VALUES (
      company_record.id,
      'Resmî İzin',
      'Resmi tatiller ve özel günler',
      true,
      '#8b5cf6'
    )
    ON CONFLICT (tenant_id, name) DO NOTHING;

    -- Diğer
    INSERT INTO leave_types (tenant_id, name, description, is_active, color)
    VALUES (
      company_record.id,
      'Diğer',
      'Diğer izin türleri',
      true,
      '#64748b'
    )
    ON CONFLICT (tenant_id, name) DO NOTHING;

  END LOOP;
END $$;

-- Yeni şirket oluşturulduğunda otomatik olarak standart izin türlerini ekleyen fonksiyon
CREATE OR REPLACE FUNCTION create_default_leave_types_for_company()
RETURNS TRIGGER AS $$
BEGIN
  -- Yıllık İzin
  INSERT INTO leave_types (tenant_id, name, description, is_active, color)
  VALUES (NEW.id, 'Yıllık İzin', 'Çalışma süresine göre hak edilen yıllık izinler', true, '#10b981');

  -- Mazeret İzni
  INSERT INTO leave_types (tenant_id, name, description, is_active, color)
  VALUES (NEW.id, 'Mazeret İzni', 'Kısa süreli mazeret izinleri', true, '#f59e0b');

  -- Raporlu İzin
  INSERT INTO leave_types (tenant_id, name, description, is_active, color)
  VALUES (NEW.id, 'Raporlu İzin', 'Sağlık raporu ile alınan izinler', true, '#ef4444');

  -- Ücretsiz İzin
  INSERT INTO leave_types (tenant_id, name, description, is_active, color)
  VALUES (NEW.id, 'Ücretsiz İzin', 'Ücret kesintisi ile verilen izinler', true, '#6366f1');

  -- Resmî İzin
  INSERT INTO leave_types (tenant_id, name, description, is_active, color)
  VALUES (NEW.id, 'Resmî İzin', 'Resmi tatiller ve özel günler', true, '#8b5cf6');

  -- Diğer
  INSERT INTO leave_types (tenant_id, name, description, is_active, color)
  VALUES (NEW.id, 'Diğer', 'Diğer izin türleri', true, '#64748b');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Yeni şirket oluşturulduğunda otomatik izin türleri ekle
DROP TRIGGER IF EXISTS trg_create_default_leave_types ON companies;
CREATE TRIGGER trg_create_default_leave_types
  AFTER INSERT ON companies
  FOR EACH ROW
  EXECUTE FUNCTION create_default_leave_types_for_company();

-- Yorum: Bu migration ile:
-- 1. Mevcut tüm şirketler için standart izin türleri oluşturulur
-- 2. Yeni oluşturulan her şirket için otomatik olarak standart izin türleri eklenir
