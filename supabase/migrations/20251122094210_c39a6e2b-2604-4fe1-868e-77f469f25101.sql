-- Update handle_new_user function to allow bypass for admin-created users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  _company_id uuid;
  _company_name text;
  _invited_by_company_id uuid;
  _default_role user_role := 'admin';
  _existing_employee_id uuid;
  _existing_employee_company_id uuid;
  _is_first_user boolean := false;
  _bypass_invite_check boolean := false;
BEGIN
  -- Check if bypass flag is set (for admin-created users via edge function)
  _bypass_invite_check := COALESCE((NEW.raw_user_meta_data ->> 'bypass_invite_check')::boolean, false);
  
  -- Check if user was invited to an existing company
  _invited_by_company_id := (NEW.raw_user_meta_data ->> 'invited_by_company_id')::uuid;
  
  -- Check if this is the first user in the system
  SELECT NOT EXISTS (SELECT 1 FROM public.profiles LIMIT 1) INTO _is_first_user;
  
  -- Eğer davet edilmemişse VE sistemde kullanıcı varsa VE bypass flag yoksa, signup'a izin verme
  IF _invited_by_company_id IS NULL AND NOT _is_first_user AND NOT _bypass_invite_check THEN
    RAISE EXCEPTION 'Kayıt olmak için davet edilmiş olmanız gerekiyor. Lütfen admin ile iletişime geçin.';
  END IF;
  
  -- Check if there's an existing employee with the same email
  SELECT id, company_id INTO _existing_employee_id, _existing_employee_company_id
  FROM public.employees
  WHERE email = NEW.email
    AND user_id IS NULL
  LIMIT 1;
  
  IF _existing_employee_id IS NOT NULL THEN
    -- Found existing employee with matching email, use their company
    _company_id := _existing_employee_company_id;
    _company_name := (SELECT name FROM public.companies WHERE id = _company_id);
    _default_role := 'admin';
    
    -- Eşleşen çalışan bulunduğunda company_id'yi kontrol et
    IF _company_id IS NULL THEN
      -- Eğer çalışanın company_id'si yoksa, yeni company oluştur
      _company_name := COALESCE(
        NEW.raw_user_meta_data ->> 'company_name',
        (NEW.email || ' Company')
      );
      
      INSERT INTO public.companies (name, email, is_active)
      VALUES (_company_name, NEW.email, true)
      RETURNING id INTO _company_id;
      
      -- Çalışanın company_id'sini güncelle
      UPDATE public.employees
      SET company_id = _company_id,
          updated_at = now()
      WHERE id = _existing_employee_id;
    END IF;
  ELSIF _invited_by_company_id IS NOT NULL THEN
    -- User was invited, use the existing company
    _company_id := _invited_by_company_id;
    _company_name := NEW.raw_user_meta_data ->> 'company_name';
    _default_role := 'admin';
  ELSIF _is_first_user OR _bypass_invite_check THEN
    -- İlk kullanıcı veya admin tarafından oluşturulan kullanıcı - yeni company oluştur
    _company_name := COALESCE(
      NEW.raw_user_meta_data ->> 'company_name',
      NEW.raw_user_meta_data ->> 'company_id',
      (NEW.email || ' Company')
    );
    
    -- Create company first
    INSERT INTO public.companies (name, email, is_active)
    VALUES (_company_name, NEW.email, true)
    RETURNING id INTO _company_id;
    
    _default_role := CASE 
      WHEN _is_first_user THEN 'owner'::user_role
      ELSE 'admin'::user_role
    END;
  ELSE
    -- Bu duruma gelmemeli çünkü yukarıda kontrol var, ama yine de hata fırlat
    RAISE EXCEPTION 'Kayıt olmak için davet edilmiş olmanız gerekiyor.';
  END IF;
  
  -- Ensure we have a valid company_id
  IF _company_id IS NULL THEN
    RAISE EXCEPTION 'Company ID cannot be null for user %', NEW.id;
  END IF;
  
  -- Insert into profiles with company_id and company_name
  INSERT INTO public.profiles (
    id, 
    full_name, 
    company_name,
    company_id,
    email,
    is_active,
    employee_id
  )
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    _company_name,
    _company_id,
    NEW.email,
    true,
    _existing_employee_id
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    company_name = EXCLUDED.company_name,
    company_id = EXCLUDED.company_id,
    email = EXCLUDED.email,
    is_active = EXCLUDED.is_active,
    employee_id = COALESCE(EXCLUDED.employee_id, profiles.employee_id),
    updated_at = now();

  -- If we found an existing employee, update it with the user_id
  IF _existing_employee_id IS NOT NULL THEN
    UPDATE public.employees
    SET user_id = NEW.id,
        updated_at = now()
    WHERE id = _existing_employee_id
      AND user_id IS NULL;
  END IF;

  -- Always assign a role to the user
  INSERT INTO public.user_roles (user_id, role, company_id)
  VALUES (NEW.id, _default_role, _company_id)
  ON CONFLICT (user_id, role, company_id) DO NOTHING;
    
  RETURN NEW;
END;
$function$;