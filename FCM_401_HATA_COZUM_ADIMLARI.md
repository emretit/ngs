# FCM 401 Hatası - Detaylı Çözüm Adımları

## ✅ Kontrol Edildi
- Service account rolleri ekli (Google Cloud Console'da görüldü)
- Firebase Cloud Messaging Admin rolü mevcut
- Firebase Admin rolü mevcut
- Service Account Token Creator rolü mevcut

## ❌ Hala 401 Hatası Alınıyor

Roller ekli olduğu halde 401 hatası alınıyorsa, aşağıdaki kontrolleri yapın:

---

## 🔍 Kontrol 1: Firebase Cloud Messaging API Etkin mi?

### Adımlar:
1. **Google Cloud Console'a gidin:**
   - https://console.cloud.google.com
   - Proje: `pafta-b84ce`

2. **API & Services → Enabled APIs:**
   - Sol menüden "API & Services" → "Enabled APIs" seçin
   - Arama kutusuna "Firebase Cloud Messaging API" yazın
   - **Etkin değilse "Enable" butonuna tıklayın**

3. **Alternatif Yol:**
   - API & Services → Library
   - "Firebase Cloud Messaging API" arayın
   - "Enable" butonuna tıklayın

---

## 🔍 Kontrol 2: Edge Function Environment Variables

Supabase Dashboard'da kontrol edin:

1. **Supabase Dashboard:**
   - https://supabase.com/dashboard
   - Projenizi seçin
   - Edge Functions → `send-push-notification` → Settings → Secrets

2. **Kontrol Edilmesi Gerekenler:**
   ```
   FIREBASE_PRIVATE_KEY        ✅ Doğru private key olmalı
   FIREBASE_PRIVATE_KEY_ID     ✅ Key ID olmalı
   FIREBASE_CLIENT_EMAIL       ✅ firebase-adminsdk-fbsvc@pafta-b84ce.iam.gserviceaccount.com
   FIREBASE_PROJECT_ID         ✅ pafta-b84ce
   ```

3. **Private Key Formatı:**
   - Private key `-----BEGIN PRIVATE KEY-----` ile başlamalı
   - `-----END PRIVATE KEY-----` ile bitmeli
   - `\n` karakterleri doğru escape edilmiş olmalı

---

## 🔍 Kontrol 3: Service Account Private Key Doğruluğu

1. **Google Cloud Console:**
   - IAM & Admin → Service Accounts
   - `firebase-adminsdk-fbsvc@pafta-b84ce.iam.gserviceaccount.com` seçin
   - "Keys" sekmesine gidin
   - Yeni bir key oluşturun (JSON formatında)
   - JSON dosyasından `private_key` değerini alın

2. **Edge Function Secret'ı Güncelleyin:**
   - Supabase Dashboard → Edge Functions → Secrets
   - `FIREBASE_PRIVATE_KEY` değerini yeni key ile güncelleyin
   - **ÖNEMLİ:** Private key'deki `\n` karakterlerini koruyun

---

## 🔍 Kontrol 4: Token Scope Kontrolü

Kodda token scope doğru görünüyor:
```typescript
scope: 'https://www.googleapis.com/auth/cloud-platform https://www.googleapis.com/auth/firebase.messaging'
```

Bu doğru. Değiştirmeye gerek yok.

---

## 🔍 Kontrol 5: FCM API Endpoint Doğruluğu

Kodda endpoint:
```typescript
https://fcm.googleapis.com/v1/projects/pafta-b84ce/messages:send
```

Bu doğru. Değiştirmeye gerek yok.

---

## 🧪 Test Adımları

1. **API'yi Etkinleştirin:**
   - Google Cloud Console → API & Services → Enabled APIs
   - "Firebase Cloud Messaging API" etkin olduğundan emin olun

2. **Edge Function'ı Yeniden Deploy Edin:**
   ```bash
   supabase functions deploy send-push-notification
   ```

3. **Test Edin:**
   - Edge function'ı çağırın
   - Logları kontrol edin
   - 401 hatası kaybolmalı

---

## 📝 Olası Senaryolar

### Senaryo 1: API Etkin Değil
- **Çözüm:** Firebase Cloud Messaging API'yi etkinleştirin
- **Kontrol:** API & Services → Enabled APIs

### Senaryo 2: Private Key Yanlış
- **Çözüm:** Yeni bir service account key oluşturun ve Edge Function secret'ını güncelleyin
- **Kontrol:** Google Cloud Console → Service Accounts → Keys

### Senaryo 3: Secret Format Hatası
- **Çözüm:** Private key'deki `\n` karakterlerini doğru escape edin
- **Kontrol:** Supabase Dashboard → Edge Functions → Secrets

### Senaryo 4: Token Scope Yetersiz
- **Durum:** Kodda doğru görünüyor, muhtemelen sorun değil
- **Kontrol:** `send-push-notification/index.ts` dosyasındaki scope değeri

---

## 🎯 Öncelik Sırası

1. **🔴 EN YÜKSEK ÖNCELİK:**
   - Firebase Cloud Messaging API etkin mi kontrol et
   - API & Services → Enabled APIs → "Firebase Cloud Messaging API"

2. **🟡 YÜKSEK ÖNCELİK:**
   - Edge Function environment variable'larını kontrol et
   - Private key doğru mu kontrol et

3. **🟢 ORTA ÖNCELİK:**
   - Edge function'ı yeniden deploy et
   - Test et ve logları kontrol et

---

## 💡 İpucu

Eğer hala 401 hatası alıyorsanız:

1. **Google Cloud Console'da API kullanımını kontrol edin:**
   - API & Services → Dashboard
   - "Firebase Cloud Messaging API" için istek sayısını kontrol edin
   - Eğer 0 ise, API etkin değil demektir

2. **Service account'un gerçekten erişimi olduğunu test edin:**
   - Google Cloud Console → IAM & Admin → IAM
   - Service account'u arayın
   - Rollerini kontrol edin

3. **Edge Function loglarını detaylı inceleyin:**
   - Supabase Dashboard → Edge Functions → Logs
   - Access token'ın başarıyla alındığını kontrol edin
   - FCM API'ye gönderilen isteği kontrol edin
