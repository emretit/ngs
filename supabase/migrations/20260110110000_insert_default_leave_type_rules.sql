-- Migration: Insert default leave type rules for annual leave (Yıllık İzin)
-- Bu migration, Türk İş Kanunu'na göre yıllık izin kurallarını oluşturur

-- Mevcut şirketler için yıllık izin kurallarını ekle
DO $$
DECLARE
  company_record RECORD;
  annual_leave_type_id UUID;
BEGIN
  -- Her şirket için yıllık izin kurallarını ekle
  FOR company_record IN SELECT id FROM companies LOOP
    
    -- Şirketin "Yıllık İzin" türünü bul
    SELECT id INTO annual_leave_type_id
    FROM leave_types
    WHERE tenant_id = company_record.id
      AND name = 'Yıllık İzin'
    LIMIT 1;
    
    -- Eğer yıllık izin türü varsa kuralları ekle
    IF annual_leave_type_id IS NOT NULL THEN
      
      -- Kural 1: 1-5 yıl arası (1 yıldan az 5 yıla kadar)
      INSERT INTO leave_type_rules (
        tenant_id,
        leave_type_id,
        name,
        min_years_of_service,
        max_years_of_service,
        days_entitled,
        description,
        priority
      )
      VALUES (
        company_record.id,
        annual_leave_type_id,
        '1-5 Yıl Arası Çalışanlar',
        0,  -- 0 yıldan (yeni başlayanlar)
        5,  -- 5 yıla kadar (5 yıl dahil değil)
        14, -- 14 gün yıllık izin
        'İşe yeni başlayan çalışanlar ve 1-5 yıl arası çalışma süresine sahip olanlar için 14 gün yıllık izin hakkı',
        1   -- En yüksek öncelik
      )
      ON CONFLICT DO NOTHING;
      
      -- Kural 2: 5-15 yıl arası
      INSERT INTO leave_type_rules (
        tenant_id,
        leave_type_id,
        name,
        min_years_of_service,
        max_years_of_service,
        days_entitled,
        description,
        priority
      )
      VALUES (
        company_record.id,
        annual_leave_type_id,
        '5-15 Yıl Arası Çalışanlar',
        5,  -- 5 yıldan (5 yıl dahil)
        15, -- 15 yıla kadar (15 yıl dahil değil)
        20, -- 20 gün yıllık izin
        '5-15 yıl arası çalışma süresine sahip çalışanlar için 20 gün yıllık izin hakkı',
        2   -- Orta öncelik
      )
      ON CONFLICT DO NOTHING;
      
      -- Kural 3: 15+ yıl
      INSERT INTO leave_type_rules (
        tenant_id,
        leave_type_id,
        name,
        min_years_of_service,
        max_years_of_service,
        days_entitled,
        description,
        priority
      )
      VALUES (
        company_record.id,
        annual_leave_type_id,
        '15 Yıl ve Üzeri Çalışanlar',
        15,  -- 15 yıldan (15 yıl dahil)
        NULL, -- Üst limit yok (sınırsız)
        26,  -- 26 gün yıllık izin
        '15 yıl ve üzeri çalışma süresine sahip deneyimli çalışanlar için 26 gün yıllık izin hakkı',
        3    -- En düşük öncelik (en son kontrol edilir)
      )
      ON CONFLICT DO NOTHING;
      
    END IF;
    
  END LOOP;
END $$;

-- Yeni şirket oluşturulduğunda otomatik olarak yıllık izin kurallarını ekleyen fonksiyonu güncelle
CREATE OR REPLACE FUNCTION create_default_leave_type_rules_for_company()
RETURNS TRIGGER AS $$
DECLARE
  annual_leave_type_id UUID;
BEGIN
  -- Yeni eklenen şirketin "Yıllık İzin" türünü bul
  SELECT id INTO annual_leave_type_id
  FROM leave_types
  WHERE tenant_id = NEW.tenant_id
    AND name = 'Yıllık İzin'
  LIMIT 1;
  
  -- Eğer yıllık izin türü varsa kuralları ekle
  IF annual_leave_type_id IS NOT NULL THEN
    
    -- Kural 1: 1-5 yıl arası
    INSERT INTO leave_type_rules (
      tenant_id, leave_type_id, name, min_years_of_service, 
      max_years_of_service, days_entitled, description, priority
    )
    VALUES (
      NEW.tenant_id, annual_leave_type_id, '1-5 Yıl Arası Çalışanlar',
      0, 5, 14, 
      'İşe yeni başlayan çalışanlar ve 1-5 yıl arası çalışma süresine sahip olanlar için 14 gün yıllık izin hakkı',
      1
    );
    
    -- Kural 2: 5-15 yıl arası
    INSERT INTO leave_type_rules (
      tenant_id, leave_type_id, name, min_years_of_service,
      max_years_of_service, days_entitled, description, priority
    )
    VALUES (
      NEW.tenant_id, annual_leave_type_id, '5-15 Yıl Arası Çalışanlar',
      5, 15, 20,
      '5-15 yıl arası çalışma süresine sahip çalışanlar için 20 gün yıllık izin hakkı',
      2
    );
    
    -- Kural 3: 15+ yıl
    INSERT INTO leave_type_rules (
      tenant_id, leave_type_id, name, min_years_of_service,
      max_years_of_service, days_entitled, description, priority
    )
    VALUES (
      NEW.tenant_id, annual_leave_type_id, '15 Yıl ve Üzeri Çalışanlar',
      15, NULL, 26,
      '15 yıl ve üzeri çalışma süresine sahip deneyimli çalışanlar için 26 gün yıllık izin hakkı',
      3
    );
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Yeni izin türü eklendiğinde (özellikle "Yıllık İzin" için) kuralları ekle
DROP TRIGGER IF EXISTS trg_create_default_leave_type_rules ON leave_types;
CREATE TRIGGER trg_create_default_leave_type_rules
  AFTER INSERT ON leave_types
  FOR EACH ROW
  WHEN (NEW.name = 'Yıllık İzin')
  EXECUTE FUNCTION create_default_leave_type_rules_for_company();

-- Çalışanın hak ettiği yıllık izin gün sayısını hesaplayan fonksiyon
CREATE OR REPLACE FUNCTION calculate_annual_leave_days(
  p_employee_id UUID,
  p_company_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_hire_date DATE;
  v_years_of_service NUMERIC;
  v_days_entitled INTEGER;
  v_annual_leave_type_id UUID;
BEGIN
  -- Çalışanın işe başlama tarihini al
  SELECT hire_date INTO v_hire_date
  FROM employees
  WHERE id = p_employee_id;
  
  IF v_hire_date IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Çalışma süresini hesapla (yıl olarak)
  v_years_of_service := EXTRACT(YEAR FROM AGE(CURRENT_DATE, v_hire_date));
  
  -- "Yıllık İzin" türünün ID'sini al
  SELECT id INTO v_annual_leave_type_id
  FROM leave_types
  WHERE tenant_id = p_company_id
    AND name = 'Yıllık İzin'
  LIMIT 1;
  
  IF v_annual_leave_type_id IS NULL THEN
    RETURN 14; -- Varsayılan olarak 14 gün
  END IF;
  
  -- Kurallara göre hak edilen gün sayısını bul
  SELECT days_entitled INTO v_days_entitled
  FROM leave_type_rules
  WHERE tenant_id = p_company_id
    AND leave_type_id = v_annual_leave_type_id
    AND (min_years_of_service IS NULL OR v_years_of_service >= min_years_of_service)
    AND (max_years_of_service IS NULL OR v_years_of_service < max_years_of_service)
  ORDER BY priority ASC
  LIMIT 1;
  
  -- Eğer kural bulunamazsa varsayılan 14 gün döndür
  RETURN COALESCE(v_days_entitled, 14);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Yorum: Bu migration ile:
-- 1. Mevcut tüm şirketler için yıllık izin kuralları oluşturulur (Türk İş Kanunu'na göre)
-- 2. Yeni oluşturulan "Yıllık İzin" türleri için otomatik olarak kurallar eklenir
-- 3. Çalışanın hak ettiği yıllık izin gün sayısını hesaplayan fonksiyon eklenir
