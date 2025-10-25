-- Bu SQL'i Supabase SQL Editor'da çalıştırarak bir kullanıcıyı super admin yapabilirsiniz
-- user_email'i değiştirmeyi unutmayın!

-- Önce kullanıcının ID'sini bulalım
DO $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Burada email adresini kendi kullanıcınızın emaili ile değiştirin
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = 'your-email@example.com'  -- BURAYA KENDİ EMAİLİNİZİ YAZIN!
  LIMIT 1;
  
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'Kullanıcı bulunamadı! Email adresini kontrol edin.';
  END IF;
  
  -- Eğer user_roles kaydı varsa güncelle, yoksa ekle
  INSERT INTO public.user_roles (user_id, is_super_admin)
  VALUES (target_user_id, true)
  ON CONFLICT (user_id) 
  DO UPDATE SET is_super_admin = true;
  
  RAISE NOTICE 'Kullanıcı % başarıyla super admin yapıldı!', target_user_id;
END $$;

-- Super admin'leri listelemek için:
-- SELECT u.email, ur.is_super_admin 
-- FROM auth.users u
-- JOIN public.user_roles ur ON u.id = ur.user_id
-- WHERE ur.is_super_admin = true;
