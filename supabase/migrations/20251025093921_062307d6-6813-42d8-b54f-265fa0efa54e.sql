-- user_roles tablosuna unique constraint ekle ve kullanıcıyı super admin yap

-- Önce unique constraint ekle (eğer yoksa)
ALTER TABLE public.user_roles 
ADD CONSTRAINT user_roles_user_id_key UNIQUE (user_id);

-- Şimdi kullanıcıyı super admin yap
DO $$
DECLARE
  target_user_id UUID;
BEGIN
  -- talip@ngsteknoloji.com kullanıcısının ID'sini bul
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = 'talip@ngsteknoloji.com'
  LIMIT 1;
  
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'Kullanıcı bulunamadı!';
  END IF;
  
  -- Önce mevcut kaydı kontrol et
  UPDATE public.user_roles 
  SET is_super_admin = true
  WHERE user_id = target_user_id;
  
  -- Eğer kayıt yoksa ekle
  IF NOT FOUND THEN
    INSERT INTO public.user_roles (user_id, is_super_admin)
    VALUES (target_user_id, true);
  END IF;
  
  RAISE NOTICE 'Kullanıcı % başarıyla super admin yapıldı!', target_user_id;
END $$;