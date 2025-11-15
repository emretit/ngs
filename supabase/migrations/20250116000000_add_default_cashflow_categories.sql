-- Migration: Tüm firmalar için varsayılan gelir ve gider kategorileri ekleme

-- Varsayılan gelir kategorileri
DO $$
DECLARE
    default_income_categories TEXT[] := ARRAY[
        'Satış Gelirleri',
        'Hizmet Gelirleri',
        'Faiz Gelirleri',
        'Diğer Gelirler'
    ];
    
    -- Varsayılan gider kategorileri
    default_expense_categories TEXT[] := ARRAY[
        'Maaş ve Ücretler',
        'Operasyonel Giderler',
        'Ham Madde',
        'Yakıt ve Bakım',
        'Kira Giderleri',
        'Genel Giderler',
        'Vergi ve Sigorta',
        'Diğer Giderler'
    ];
    
    company_record RECORD;
    category_name TEXT;
BEGIN
    -- Tüm mevcut firmalar için varsayılan kategorileri ekle
    FOR company_record IN SELECT id FROM companies LOOP
        -- Gelir kategorilerini ekle
        FOREACH category_name IN ARRAY default_income_categories LOOP
            -- Eğer bu kategori bu firma için zaten yoksa ekle
            IF NOT EXISTS (
                SELECT 1 FROM cashflow_categories 
                WHERE company_id = company_record.id 
                AND name = category_name 
                AND type = 'income'
            ) THEN
                INSERT INTO cashflow_categories (name, type, company_id, created_at, updated_at)
                VALUES (category_name, 'income', company_record.id, NOW(), NOW());
            END IF;
        END LOOP;
        
        -- Gider kategorilerini ekle
        FOREACH category_name IN ARRAY default_expense_categories LOOP
            -- Eğer bu kategori bu firma için zaten yoksa ekle
            IF NOT EXISTS (
                SELECT 1 FROM cashflow_categories 
                WHERE company_id = company_record.id 
                AND name = category_name 
                AND type = 'expense'
            ) THEN
                INSERT INTO cashflow_categories (name, type, company_id, created_at, updated_at)
                VALUES (category_name, 'expense', company_record.id, NOW(), NOW());
            END IF;
        END LOOP;
    END LOOP;
END $$;

-- Yeni firma oluşturulduğunda otomatik olarak varsayılan kategorileri ekleyen function
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
        'Diğer Giderler'
    ];
    
    category_name TEXT;
BEGIN
    -- Yeni firma için gelir kategorilerini ekle
    FOREACH category_name IN ARRAY default_income_categories LOOP
        INSERT INTO cashflow_categories (name, type, company_id, created_at, updated_at)
        VALUES (category_name, 'income', NEW.id, NOW(), NOW());
    END LOOP;
    
    -- Yeni firma için gider kategorilerini ekle
    FOREACH category_name IN ARRAY default_expense_categories LOOP
        INSERT INTO cashflow_categories (name, type, company_id, created_at, updated_at)
        VALUES (category_name, 'expense', NEW.id, NOW(), NOW());
    END LOOP;
    
    RETURN NEW;
END;
$$;

-- Yeni firma oluşturulduğunda trigger'ı oluştur
DROP TRIGGER IF EXISTS trigger_create_default_cashflow_categories ON companies;
CREATE TRIGGER trigger_create_default_cashflow_categories
    AFTER INSERT ON companies
    FOR EACH ROW
    EXECUTE FUNCTION public.create_default_cashflow_categories_for_company();

