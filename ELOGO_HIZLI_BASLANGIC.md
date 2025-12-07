# 🚀 e-Logo Hızlı Başlangıç Kılavuzu

Bu kılavuz, e-Logo entegrasyonunu hızlıca kullanmaya başlamanız için adım adım talimatlar içerir.

## ⚡ Hızlı Adımlar

### 1️⃣ Edge Functions'ları Deploy Edin

Terminal'de şu komutları çalıştırın:

```bash
cd /Users/emreaydin/pafta/ngs

# Supabase CLI ile deploy (eğer Supabase CLI yüklüyse)
supabase functions deploy elogo-auth
supabase functions deploy elogo-incoming-invoices
supabase functions deploy elogo-check-mukellef

# VEYA Supabase Dashboard üzerinden:
# 1. https://supabase.com/dashboard → Projenizi seçin
# 2. Edge Functions → New Function
# 3. Her bir function için:
#    - elogo-auth
#    - elogo-incoming-invoices
#    - elogo-check-mukellef
# 4. İlgili klasörlerdeki index.ts dosyalarını kopyalayın
```

**Önemli:** `_shared/soap-helper.ts` dosyasını da deploy etmeniz gerekiyor. Supabase, `_shared` klasöründeki dosyaları otomatik olarak tüm functions'lara dahil eder.

### 2️⃣ Database Migration'ı Kontrol Edin

Migration zaten uygulandı, ancak kontrol etmek için:

```bash
# Supabase Dashboard → Database → Migrations
# VEYA CLI ile:
supabase db reset  # (Dikkat: Bu tüm verileri sıfırlar!)
# VEYA sadece yeni migration'ı uygula:
supabase migration up
```

### 3️⃣ UI'da Entegratör Seçimi

1. **Pafta uygulamasını açın**
2. **Ayarlar** menüsüne gidin
3. **"E-Fatura Entegratörü"** kartına tıklayın
4. **"e-Logo"** seçeneğini seçin (radio button)

### 4️⃣ e-Logo Kimlik Bilgilerini Girin

1. Aynı sayfada **"e-Logo Ayarları"** bölümüne gidin
2. **Kullanıcı Adı:** e-Logo hesabınızın kullanıcı adı
3. **Şifre:** e-Logo hesabınızın şifresi
4. **Test Modu:** 
   - ✅ **Aktif** → Test ortamı (https://pb-demo.elogo.com.tr)
   - ❌ **Pasif** → Production ortamı (https://pb.elogo.com.tr)
5. **"Bağlan"** butonuna tıklayın

### 5️⃣ Test Edin

1. **E-Fatura** sayfasına gidin
2. Gelen faturaların e-Logo'dan geldiğini kontrol edin
3. Müşteri/Tedarikçi eklerken VKN girerek mükellef sorgulamasını test edin

## 🔧 Sorun Giderme

### Edge Function Deploy Hatası

**Hata:** `Module not found: '../_shared/soap-helper.ts'`

**Çözüm:** 
- `_shared` klasörünün doğru konumda olduğundan emin olun
- Supabase Dashboard'da function'ı oluştururken `_shared` klasörünü de yükleyin

### Database Migration Hatası

**Hata:** `relation "elogo_auth" does not exist`

**Çözüm:**
```sql
-- Supabase SQL Editor'de çalıştırın:
SELECT * FROM supabase_migrations.schema_migrations 
ORDER BY version DESC LIMIT 5;

-- Eğer migration uygulanmamışsa, migration dosyasını manuel çalıştırın
```

### Bağlantı Hatası

**Hata:** `e-Logo giriş başarısız`

**Kontrol Listesi:**
- ✅ Kullanıcı adı ve şifre doğru mu?
- ✅ Test/Production modu doğru seçilmiş mi?
- ✅ e-Logo hesabınız aktif mi?
- ✅ Internet bağlantınız var mı?
- ✅ Edge Function'lar deploy edildi mi?

### Faturalar Görünmüyor

**Kontrol Listesi:**
- ✅ Entegratör seçimi "e-Logo" olarak ayarlanmış mı?
- ✅ e-Logo kimlik bilgileri doğru mu?
- ✅ e-Logo hesabınızda gelen fatura var mı?
- ✅ Browser console'da hata var mı? (F12 → Console)

## 📞 Destek

Sorun yaşarsanız:
1. Browser Console'u kontrol edin (F12)
2. Supabase Dashboard → Edge Functions → Logs
3. Network tab'ında API çağrılarını kontrol edin

## ✅ Başarı Kontrolü

Her şey çalışıyorsa:
- ✅ Ayarlar sayfasında "e-Logo" seçili ve "Yapılandırılmış" görünüyor
- ✅ e-Logo ayarlarında "e-Logo bağlantısı aktif" mesajı var
- ✅ E-Fatura sayfasında faturalar görünüyor
- ✅ Mükellef sorgulama çalışıyor

---

**Not:** Production kullanımı için Test Modu'nu kapatmayı unutmayın!
