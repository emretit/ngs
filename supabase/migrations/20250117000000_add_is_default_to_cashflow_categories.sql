-- Migration: Varsayılan kategorileri işaretlemek için is_default kolonu ekleme

-- 1. is_default kolonunu ekle
ALTER TABLE public.cashflow_categories
ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false;

-- 2. Mevcut varsayılan kategorileri işaretle
UPDATE public.cashflow_categories
SET is_default = true
WHERE name IN (
    'Satış Gelirleri',
    'Hizmet Gelirleri',
    'Faiz Gelirleri',
    'Diğer Gelirler',
    'Maaş ve Ücretler',
    'Operasyonel Giderler',
    'Ham Madde',
    'Yakıt ve Bakım',
    'Kira Giderleri',
    'Genel Giderler',
    'Vergi ve Sigorta',
    'Diğer Giderler'
);

-- 3. Yeni firma oluşturulduğunda varsayılan kategorileri ekleyen function'ı güncelle
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
    -- Yeni firma için gelir kategorilerini ekle (is_default = true ile)
    FOREACH category_name IN ARRAY default_income_categories LOOP
        INSERT INTO cashflow_categories (name, type, company_id, is_default, created_at, updated_at)
        VALUES (category_name, 'income', NEW.id, true, NOW(), NOW());
    END LOOP;
    
    -- Yeni firma için gider kategorilerini ekle (is_default = true ile)
    FOREACH category_name IN ARRAY default_expense_categories LOOP
        INSERT INTO cashflow_categories (name, type, company_id, is_default, created_at, updated_at)
        VALUES (category_name, 'expense', NEW.id, true, NOW(), NOW());
    END LOOP;
    
    RETURN NEW;
END;
$$;

-- Not: Silme kontrolü kod tarafında yapılıyor (useCashflowCategories.ts)
-- RLS policy eklemek isterseniz, RLS aktifse şu şekilde ekleyebilirsiniz:
-- CREATE POLICY "Prevent deletion of default categories"
-- ON public.cashflow_categories
-- FOR DELETE
-- USING (is_default = false);

