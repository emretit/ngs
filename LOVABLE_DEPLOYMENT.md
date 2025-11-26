# Lovable Deployment Rehberi

## 🔒 Güvenlik Açıklaması

Lovable'a Supabase bilgilerini vermek **güvenlidir** çünkü:

### ✅ Güvenli Bilgiler (Lovable'a Verilebilir)

1. **VITE_SUPABASE_URL** - Supabase proje URL'iniz
   - Bu zaten public bir bilgi
   - Herkes tarafından görülebilir
   - Örnek: `https://vwhwufnckpqirxptwncw.supabase.co`

2. **VITE_SUPABASE_ANON_KEY** - Anon (Public) Key
   - Bu **zaten public** bir key
   - Browser'da görülebilir (Network tab'ında)
   - RLS (Row Level Security) politikaları ile korunuyor
   - Sadece kullanıcının yetkisi olan verilere erişebilir

### ❌ ASLA Verilmemesi Gereken Bilgiler

1. **SUPABASE_SERVICE_ROLE_KEY** - Service Role Key
   - Bu key **ASLA** Lovable'a verilmemeli
   - Sadece server-side (Edge Functions) için kullanılmalı
   - RLS politikalarını bypass eder
   - Bu key'i verirseniz veritabanınızın tam kontrolü verilmiş olur

## 📋 Lovable'da Yapılacaklar

### 1. Environment Variables Ekleme

Lovable Dashboard'da şu environment variable'ları ekleyin:

```
VITE_SUPABASE_URL=https://vwhwufnckpqirxptwncw.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Nasıl Bulunur:**
1. Supabase Dashboard'a gidin: https://supabase.com/dashboard
2. Projenizi seçin
3. Settings → API
4. **Project URL** → `VITE_SUPABASE_URL` olarak kopyalayın
5. **anon public** key → `VITE_SUPABASE_ANON_KEY` olarak kopyalayın

### 2. Diğer Gerekli Environment Variables

Eğer kullanıyorsanız:

```
VITE_GROQ_API_KEY=gsk_...
VITE_LOCATIONIQ_API_KEY=pk...
```

### 3. Build Ayarları

Lovable genellikle otomatik olarak algılar, ama manuel ayarlarsanız:

- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Node Version:** 18+ (Lovable otomatik yönetir)

## 🛡️ Güvenlik Kontrol Listesi

- [x] Sadece `VITE_SUPABASE_URL` ve `VITE_SUPABASE_ANON_KEY` Lovable'a eklendi
- [ ] `SUPABASE_SERVICE_ROLE_KEY` **ASLA** eklenmedi
- [ ] Supabase Dashboard'da RLS (Row Level Security) politikaları aktif
- [ ] CORS ayarları kontrol edildi (Supabase Dashboard → Settings → API)

## 🔍 Neden Bu Bilgiler Güvenli?

### Anon Key Nasıl Çalışır?

1. **RLS Koruması:** Supabase'de her tablo için Row Level Security (RLS) politikaları tanımlanır
2. **Kullanıcı Bazlı Erişim:** Anon key ile yapılan istekler, kullanıcının kimliğine göre filtrelenir
3. **Politika Kontrolü:** RLS politikaları, kullanıcının sadece yetkili olduğu verilere erişmesine izin verir

### Örnek Senaryo

```sql
-- Örnek RLS Politikası
CREATE POLICY "Users can only see their own data"
ON profiles FOR SELECT
USING (auth.uid() = user_id);
```

Bu politika sayesinde:
- Anon key ile yapılan istekler sadece kullanıcının kendi verilerine erişebilir
- Başka kullanıcıların verilerine erişilemez
- Service role key olmadan RLS bypass edilemez

## 🚨 Önemli Notlar

1. **Service Role Key'i Saklayın:**
   - Bu key'i sadece Supabase Edge Functions'da kullanın
   - Lovable'a **ASLA** eklemeyin
   - Bu key'i paylaşmayın

2. **RLS Politikalarını Kontrol Edin:**
   - Supabase Dashboard → Authentication → Policies
   - Her tablo için uygun politikalar tanımlı olmalı
   - Test edin: Farklı kullanıcılarla giriş yapıp erişim kontrolü yapın

3. **CORS Ayarları:**
   - Supabase Dashboard → Settings → API
   - Lovable domain'inizi allowed origins'a ekleyin

## 📞 Sorun Giderme

### "Missing required Supabase environment variables" Hatası

1. Lovable Dashboard'da environment variables'ların eklendiğinden emin olun
2. Variable isimlerinin tam olarak `VITE_SUPABASE_URL` ve `VITE_SUPABASE_ANON_KEY` olduğunu kontrol edin
3. Build'i yeniden başlatın

### Supabase Bağlantı Hatası

1. `VITE_SUPABASE_URL` doğru mu kontrol edin
2. `VITE_SUPABASE_ANON_KEY` doğru mu kontrol edin
3. Supabase Dashboard'da projenin aktif olduğunu kontrol edin
4. CORS ayarlarını kontrol edin

## ✅ Sonuç

Lovable'a **sadece** `VITE_SUPABASE_URL` ve `VITE_SUPABASE_ANON_KEY` eklemek:
- ✅ Güvenlidir
- ✅ Standart bir pratiktir
- ✅ Tüm frontend deployment platformlarında (Vercel, Netlify, vb.) aynı şekilde yapılır
- ✅ Service role key'e ihtiyaç yoktur (frontend için)

Service role key sadece server-side işlemler için gereklidir ve Lovable frontend deploy platformu olduğu için gerekmez.

