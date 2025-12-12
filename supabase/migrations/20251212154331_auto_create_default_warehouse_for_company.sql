-- Her company oluşturulduğunda otomatik olarak 1 adet "Ana Depo" oluştur

-- Fonksiyon: Yeni company oluşturulduğunda otomatik depo oluştur
CREATE OR REPLACE FUNCTION public.create_default_warehouse_for_company()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  -- Yeni company için otomatik olarak "Ana Depo" oluştur
  INSERT INTO public.warehouses (
    company_id,
    name,
    warehouse_type,
    is_active,
    country,
    capacity_unit
  )
  VALUES (
    NEW.id,
    'Ana Depo',
    'main',
    true,
    COALESCE(NEW.country, 'Turkey'),
    'm2'
  );
  
  RETURN NEW;
END;
$$;

-- Trigger: companies tablosuna INSERT yapıldığında tetiklenir
DROP TRIGGER IF EXISTS trigger_create_default_warehouse ON public.companies;

CREATE TRIGGER trigger_create_default_warehouse
  AFTER INSERT ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_warehouse_for_company();

-- Mevcut company'ler için de depo oluştur (eğer yoksa)
-- Sadece depo olmayan company'ler için çalışır
INSERT INTO public.warehouses (
  company_id,
  name,
  warehouse_type,
  is_active,
  country,
  capacity_unit
)
SELECT 
  c.id,
  'Ana Depo',
  'main',
  true,
  COALESCE(c.country, 'Turkey'),
  'm2'
FROM public.companies c
WHERE NOT EXISTS (
  SELECT 1 
  FROM public.warehouses w 
  WHERE w.company_id = c.id
)
ON CONFLICT DO NOTHING;

