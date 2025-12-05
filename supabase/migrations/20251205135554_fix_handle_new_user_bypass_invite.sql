-- Fix handle_new_user function to support bypass_invite_check flag
-- This allows register-user edge function to create profiles for new users

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
  bypass_invite_check boolean;
  _company_id uuid;
  _company_name text;
  _is_first_user boolean := false;
BEGIN
  -- Metadata'dan bilgileri al
  invited_company_id := (NEW.raw_user_meta_data ->> 'invited_by_company_id')::uuid;
  invited_company_name := NEW.raw_user_meta_data ->> 'company_name';
  invited_role := COALESCE(NEW.raw_user_meta_data ->> 'invited_role', 'admin');
  invited_employee_id := (NEW.raw_user_meta_data ->> 'employee_id')::uuid;
  bypass_invite_check := COALESCE((NEW.raw_user_meta_data ->> 'bypass_invite_check')::boolean, false);

  -- Check if this is the first user in the system
  SELECT NOT EXISTS (SELECT 1 FROM public.profiles LIMIT 1) INTO _is_first_user;

  -- Company ID belirleme mantığı
  IF invited_company_id IS NOT NULL THEN
    -- Davet edilmiş kullanıcı - mevcut company'yi kullan
    _company_id := invited_company_id;
    _company_name := COALESCE(invited_company_name, (SELECT name FROM public.companies WHERE id = invited_company_id));
    invited_role := COALESCE(invited_role, 'admin');
  ELSIF bypass_invite_check OR _is_first_user THEN
    -- Admin tarafından oluşturulan kullanıcı veya ilk kullanıcı - yeni company oluştur
    _company_name := COALESCE(
      invited_company_name,
      NEW.raw_user_meta_data ->> 'company_name',
      (NEW.email || ' Company')
    );
    
    -- Create company first
    INSERT INTO public.companies (name, email, is_active)
    VALUES (_company_name, NEW.email, true)
    RETURNING id INTO _company_id;
    
    -- İlk kullanıcı ise owner, değilse admin rolü ver
    invited_role := CASE 
      WHEN _is_first_user THEN 'owner'
      ELSE 'admin'
    END;
  ELSE
    -- Normal kayıt ama davet edilmemiş - hata fırlat (güvenlik için)
    RAISE EXCEPTION 'Kayıt olmak için davet edilmiş olmanız gerekiyor. Lütfen admin ile iletişime geçin.';
  END IF;

  -- Ensure we have a valid company_id
  IF _company_id IS NULL THEN
    RAISE EXCEPTION 'Company ID cannot be null for user %', NEW.id;
  END IF;

  -- Profiles tablosuna INSERT veya UPDATE
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
    _company_id,
    _company_name,
    true,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = COALESCE(EXCLUDED.email, profiles.email),
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    company_id = COALESCE(EXCLUDED.company_id, profiles.company_id),
    company_name = COALESCE(EXCLUDED.company_name, profiles.company_name),
    updated_at = NOW();

  -- User roles tablosuna INSERT (company_id varsa)
  IF _company_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role, company_id, created_at)
    VALUES (NEW.id, invited_role::user_role, _company_id, NOW())
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

