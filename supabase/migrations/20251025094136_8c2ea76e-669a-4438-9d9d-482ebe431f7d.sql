-- emre@ngsteknoloji.com kullanıcısını super admin yap
-- talip@ngsteknoloji.com kullanıcısının super admin yetkisini kaldır

DO $$
DECLARE
  emre_user_id UUID;
  talip_user_id UUID;
BEGIN
  -- emre@ngsteknoloji.com kullanıcısının ID'sini bul
  SELECT id INTO emre_user_id
  FROM auth.users
  WHERE email = 'emre@ngsteknoloji.com'
  LIMIT 1;
  
  -- talip@ngsteknoloji.com kullanıcısının ID'sini bul
  SELECT id INTO talip_user_id
  FROM auth.users
  WHERE email = 'talip@ngsteknoloji.com'
  LIMIT 1;
  
  IF emre_user_id IS NULL THEN
    RAISE EXCEPTION 'emre@ngsteknoloji.com kullanıcısı bulunamadı!';
  END IF;
  
  -- talip'in super admin yetkisini kaldır
  IF talip_user_id IS NOT NULL THEN
    UPDATE public.user_roles 
    SET is_super_admin = false
    WHERE user_id = talip_user_id;
    RAISE NOTICE 'talip@ngsteknoloji.com kullanıcısının super admin yetkisi kaldırıldı';
  END IF;
  
  -- emre'yi super admin yap
  UPDATE public.user_roles 
  SET is_super_admin = true
  WHERE user_id = emre_user_id;
  
  IF NOT FOUND THEN
    INSERT INTO public.user_roles (user_id, is_super_admin)
    VALUES (emre_user_id, true);
  END IF;
  
  RAISE NOTICE 'emre@ngsteknoloji.com başarıyla super admin yapıldı!';
END $$;

-- Sonucu kontrol et
SELECT u.email, ur.is_super_admin, ur.role
FROM auth.users u
JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.email IN ('emre@ngsteknoloji.com', 'talip@ngsteknoloji.com');