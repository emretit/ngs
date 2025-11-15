-- Migration: Araç Giderleri ana kategorisi ve sabit alt kategorileri ekleme

-- 1. Tüm mevcut firmalara "Araç Giderleri" ana kategorisini ekle (sabit olarak)
DO $$
DECLARE
    company_record RECORD;
    vehicle_category_id UUID;
    default_subcategories TEXT[] := ARRAY[
        'Bakım/Onarım',
        'Ceza',
        'Kasko/Sigorta',
        'Kiralama',
        'Muayene',
        'OGS-HGS',
        'OTOPARK',
        'Satın Alma',
        'Vergi',
        'Yakıt'
    ];
    subcategory_name TEXT;
BEGIN
    -- Tüm mevcut firmalar için "Araç Giderleri" kategorisini ekle
    FOR company_record IN SELECT id FROM companies LOOP
        -- Eğer bu kategori bu firma için zaten yoksa ekle
        IF NOT EXISTS (
            SELECT 1 FROM cashflow_categories 
            WHERE company_id = company_record.id 
            AND name = 'Araç Giderleri' 
            AND type = 'expense'
        ) THEN
            INSERT INTO cashflow_categories (name, type, company_id, is_default, created_at, updated_at)
            VALUES ('Araç Giderleri', 'expense', company_record.id, true, NOW(), NOW())
            RETURNING id INTO vehicle_category_id;
            
            -- Bu kategori için sabit alt kategorileri ekle
            FOREACH subcategory_name IN ARRAY default_subcategories LOOP
                INSERT INTO cashflow_subcategories (category_id, name, company_id, created_at, updated_at)
                VALUES (vehicle_category_id, subcategory_name, company_record.id, NOW(), NOW());
            END LOOP;
        ELSE
            -- Kategori zaten varsa, ID'sini al ve alt kategorileri kontrol et
            SELECT id INTO vehicle_category_id
            FROM cashflow_categories
            WHERE company_id = company_record.id 
            AND name = 'Araç Giderleri' 
            AND type = 'expense';
            
            -- Mevcut kategoriyi sabit olarak işaretle
            UPDATE cashflow_categories
            SET is_default = true
            WHERE id = vehicle_category_id;
            
            -- Alt kategorileri ekle (yoksa)
            FOREACH subcategory_name IN ARRAY default_subcategories LOOP
                IF NOT EXISTS (
                    SELECT 1 FROM cashflow_subcategories
                    WHERE category_id = vehicle_category_id
                    AND name = subcategory_name
                    AND company_id = company_record.id
                ) THEN
                    INSERT INTO cashflow_subcategories (category_id, name, company_id, created_at, updated_at)
                    VALUES (vehicle_category_id, subcategory_name, company_record.id, NOW(), NOW());
                END IF;
            END LOOP;
        END IF;
    END LOOP;
END $$;

-- 2. Yeni firma oluşturulduğunda "Araç Giderleri" ve alt kategorilerini ekleyen function'ı güncelle
CREATE OR REPLACE FUNCTION public.create_default_cashflow_categories_for_company()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    default_income_categories TEXT[] := ARRAY[
        'Satış Gelirleri',
        'Hizmet Gelirleri',
        'Faiz Gelirleri',
        'Diğer Gelirler'
    ];
    
    default_expense_categories TEXT[] := ARRAY[
        'Maaş ve Ücretler',
        'Operasyonel Giderler',
        'Ham Madde',
        'Yakıt ve Bakım',
        'Kira Giderleri',
        'Genel Giderler',
        'Vergi ve Sigorta',
        'Diğer Giderler',
        'Araç Giderleri'
    ];
    
    vehicle_subcategories TEXT[] := ARRAY[
        'Bakım/Onarım',
        'Ceza',
        'Kasko/Sigorta',
        'Kiralama',
        'Muayene',
        'OGS-HGS',
        'OTOPARK',
        'Satın Alma',
        'Vergi',
        'Yakıt'
    ];
    
    category_name TEXT;
    vehicle_category_id UUID;
    subcategory_name TEXT;
BEGIN
    -- Yeni firma için gelir kategorilerini ekle (is_default = true ile)
    FOREACH category_name IN ARRAY default_income_categories LOOP
        INSERT INTO cashflow_categories (name, type, company_id, is_default, created_at, updated_at)
        VALUES (category_name, 'income', NEW.id, true, NOW(), NOW());
    END LOOP;
    
    -- Yeni firma için gider kategorilerini ekle (is_default = true ile)
    FOREACH category_name IN ARRAY default_expense_categories LOOP
        IF category_name = 'Araç Giderleri' THEN
            -- Araç Giderleri kategorisini ekle ve ID'sini al
            INSERT INTO cashflow_categories (name, type, company_id, is_default, created_at, updated_at)
            VALUES (category_name, 'expense', NEW.id, true, NOW(), NOW())
            RETURNING id INTO vehicle_category_id;
            
            -- Araç Giderleri için sabit alt kategorileri ekle
            FOREACH subcategory_name IN ARRAY vehicle_subcategories LOOP
                INSERT INTO cashflow_subcategories (category_id, name, company_id, created_at, updated_at)
                VALUES (vehicle_category_id, subcategory_name, NEW.id, NOW(), NOW());
            END LOOP;
        ELSE
            INSERT INTO cashflow_categories (name, type, company_id, is_default, created_at, updated_at)
            VALUES (category_name, 'expense', NEW.id, true, NOW(), NOW());
        END IF;
    END LOOP;
    
    RETURN NEW;
END;
$$;

