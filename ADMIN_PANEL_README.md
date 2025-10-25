# Admin Panel Kullanım Kılavuzu

## 🎯 Genel Bakış

Admin panel, sistemdeki tüm şirketleri yönetmek için oluşturulmuş özel bir yönetim arayüzüdür. Sadece **Super Admin** yetkisine sahip kullanıcılar bu panele erişebilir.

## 🔐 Super Admin Yetkisi

### Mevcut Super Admin'ler
- **emre@ngsteknoloji.com** (Super Admin ✅)

### Yeni Super Admin Ekleme

Yeni bir kullanıcıyı super admin yapmak için Supabase SQL Editor'da aşağıdaki SQL'i çalıştırın:

```sql
DO $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Email adresini değiştirin
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = 'yeni-admin@example.com'  -- BURAYA YENİ ADMIN'İN EMAIL'İNİ YAZIN
  LIMIT 1;
  
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'Kullanıcı bulunamadı! Email adresini kontrol edin.';
  END IF;
  
  -- Mevcut kaydı güncelle veya yeni kayıt ekle
  UPDATE public.user_roles 
  SET is_super_admin = true
  WHERE user_id = target_user_id;
  
  IF NOT FOUND THEN
    INSERT INTO public.user_roles (user_id, is_super_admin)
    VALUES (target_user_id, true);
  END IF;
  
  RAISE NOTICE 'Kullanıcı başarıyla super admin yapıldı!';
END $$;
```

### Super Admin'leri Listeleme

```sql
SELECT u.email, ur.is_super_admin, ur.role
FROM auth.users u
JOIN public.user_roles ur ON u.id = ur.user_id
WHERE ur.is_super_admin = true;
```

## 📍 Admin Panel Rotaları

- `/admin` - Admin Dashboard (İstatistikler)
- `/admin/companies` - Şirket Listesi
- `/admin/companies/new` - Yeni Şirket Oluştur
- `/admin/companies/:id` - Şirket Detay/Düzenle

## 🎨 Admin Panel Özellikleri

### 1. Dashboard (`/admin`)
- Toplam şirket sayısı
- Aktif/Pasif şirket istatistikleri
- Son eklenen şirketler listesi
- Hızlı erişim kartları

### 2. Şirket Listesi (`/admin/companies`)
- Tüm şirketleri tablo görünümünde listele
- Arama ve filtreleme
- Şirket durumunu aktif/pasif yapma
- Düzenleme ve silme işlemleri
- Yeni şirket ekleme butonu

### 3. Şirket Oluşturma/Düzenleme
**Temel Bilgiler:**
- Şirket Adı (zorunlu)
- Email
- Telefon
- Adres
- Domain
- Website

**Vergi ve Finansal Bilgiler:**
- Vergi Numarası
- Vergi Dairesi
- Varsayılan Para Birimi

**Durum Ayarları:**
- Aktif/Pasif durumu (Switch ile)

## 🔒 Güvenlik

### RLS (Row Level Security) Politikaları

Admin panel için özel RLS politikaları eklenmiştir:

```sql
-- Super adminler tüm şirketleri görebilir
CREATE POLICY "Super admins can view all companies"
ON public.companies FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND is_super_admin = true
  )
  OR id = (SELECT company_id FROM public.profiles WHERE id = auth.uid())
);

-- Sadece super adminler şirket ekleyebilir
CREATE POLICY "Super admins can insert companies"
ON public.companies FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND is_super_admin = true
  )
);
```

### Route Guard

`AdminRouteGuard` komponenti, admin rotalarına erişimi kontrol eder:
- Kullanıcı giriş yapmış mı?
- Kullanıcı super admin mi?
- Yetki yoksa ana sayfaya yönlendir

## 🎯 Kullanım Senaryoları

### Yeni Şirket Ekleme
1. Admin panel'e giriş yap (`/admin`)
2. "Şirketler" menüsüne tıkla
3. "Yeni Şirket" butonuna tıkla
4. Şirket bilgilerini doldur
5. "Kaydet" butonuna tıkla

### Şirket Düzenleme
1. Şirket listesinde düzenlemek istediğin şirketi bul
2. Kalem ikonuna tıkla
3. Bilgileri güncelle
4. "Kaydet" butonuna tıkla

### Şirket Aktif/Pasif Yapma
1. Şirket listesinde ilgili şirketi bul
2. Power (⚡) ikonuna tıkla
3. Durum anında değişir

### Şirket Arama
1. Şirket listesinde arama kutusuna yaz
2. İsim, email veya domain'e göre anında filtreleme

## 🎨 UI/UX Özellikleri

- **Responsive tasarım**: Mobil ve desktop uyumlu
- **Arama ve filtreleme**: Hızlı şirket bulma
- **Badge sistemi**: Durum göstergeleri (Aktif/Pasif)
- **Toast bildirimleri**: Başarı/hata mesajları
- **Loading states**: Yükleme animasyonları
- **Form validasyonu**: Zod ile tip güvenli validasyon

## 🛠️ Teknik Detaylar

### Kullanılan Teknolojiler
- React Router (routing)
- TanStack Query (data fetching & caching)
- React Hook Form + Zod (form yönetimi)
- Shadcn UI (UI bileşenleri)
- Supabase (backend & database)

### Hook'lar
- `useSuperAdmin()` - Super admin durumunu kontrol eder
- `useAllCompanies()` - Tüm şirketleri getirir
- `useCreateCompany()` - Yeni şirket oluşturur
- `useUpdateCompany()` - Şirket günceller
- `useToggleCompanyStatus()` - Şirket durumunu değiştirir

### Dosya Yapısı
```
src/
├── pages/admin/
│   ├── AdminDashboard.tsx      # Dashboard sayfası
│   ├── Companies.tsx            # Şirket listesi
│   └── CompanyDetail.tsx        # Şirket oluştur/düzenle
├── components/
│   └── layouts/
│       └── AdminLayout.tsx      # Admin panel layout'u
├── routes/
│   ├── AdminRouteGuard.tsx      # Super admin guard
│   └── adminRoutes.tsx          # Admin rotaları
└── hooks/
    ├── useSuperAdmin.ts         # Super admin hook
    └── useCompanies.ts          # Şirket yönetim hook'ları
```

## 📝 Notlar

- Admin panel sadece super admin'lere görünür
- Normal kullanıcılar admin panel linkini navbar'da göremez
- Tüm işlemler audit log'a kaydedilir
- Şirket silme işlemi soft delete (is_active = false)
- Para birimi varsayılan olarak "₺" gelir

## 🚀 Geliştirme Planı

### Gelecek Özellikler
- [ ] Şirket kullanıcılarını görüntüleme
- [ ] Şirket bazlı istatistikler ve raporlar
- [ ] Logo yükleme/değiştirme
- [ ] Toplu şirket işlemleri
- [ ] Şirket export/import (Excel, CSV)
- [ ] Şirket silme onay modalı
- [ ] Şirket geçmişi (audit log)
- [ ] Şirket notları ve etiketleri

## 🐛 Sorun Giderme

### "Admin Panel görünmüyor"
- Kullanıcınızın super admin yetkisi var mı kontrol edin
- Veritabanında `user_roles` tablosunda `is_super_admin = true` olmalı

### "Şirket kaydedemiyorum"
- RLS politikalarını kontrol edin
- Super admin yetkisini kontrol edin
- Console'da hata mesajlarını inceleyin

### "Liste boş görünüyor"
- Companies tablosunda veri var mı kontrol edin
- RLS politikalarının doğru çalıştığından emin olun
