-- Handle_new_user trigger'ı toleranslı hale getir
-- Davet ile gelen kullanıcılar için profiles zaten oluşturulmuş olabilir

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invited_company_id uuid;
  invited_company_name text;
  invited_role text;
  invited_employee_id uuid;
BEGIN
  -- Metadata'dan bilgileri al
  invited_company_id := (NEW.raw_user_meta_data ->> 'invited_by_company_id')::uuid;
  invited_company_name := NEW.raw_user_meta_data ->> 'company_name';
  invited_role := COALESCE(NEW.raw_user_meta_data ->> 'invited_role', 'admin');
  invited_employee_id := (NEW.raw_user_meta_data ->> 'employee_id')::uuid;

  -- Profiles tablosuna INSERT veya UPDATE (zaten varsa güncelle)
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    company_id,
    company_name,
    is_active,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name'),
    invited_company_id,
    invited_company_name,
    true,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    company_id = COALESCE(EXCLUDED.company_id, profiles.company_id),
    company_name = COALESCE(EXCLUDED.company_name, profiles.company_name),
    updated_at = NOW();

  -- User roles tablosuna INSERT (zaten varsa atla)
  IF invited_company_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role, company_id, created_at)
    VALUES (NEW.id, invited_role, invited_company_id, NOW())
    ON CONFLICT (user_id, role, company_id) DO NOTHING;
  END IF;

  -- Employee bağlantısı varsa güncelle
  IF invited_employee_id IS NOT NULL THEN
    UPDATE public.employees
    SET user_id = NEW.id, updated_at = NOW()
    WHERE id = invited_employee_id;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Hata durumunda loglama yap ama işlemi engelleme
    RAISE WARNING 'handle_new_user error for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;