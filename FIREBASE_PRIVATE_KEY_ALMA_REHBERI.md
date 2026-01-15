# Firebase Private Key Alma Rehberi

## 📋 Firebase Service Account Key Nasıl Alınır?

Firebase private key'i Google Cloud Console'dan service account key dosyası (JSON) olarak alabilirsiniz.

---

## 🔑 Adım Adım: Service Account Key Oluşturma

### Adım 1: Google Cloud Console'a Giriş

1. **Google Cloud Console'a gidin:**
   - https://console.cloud.google.com
   - Proje: `pafta-b84ce` seçin

2. **IAM & Admin → Service Accounts:**
   - Sol menüden "IAM & Admin" → "Service Accounts" seçin
   - Veya direkt link: https://console.cloud.google.com/iam-admin/serviceaccounts?project=pafta-b84ce

---

### Adım 2: Service Account'u Bulun

1. **Service account listesinde arayın:**
   - `firebase-adminsdk-fbsvc@pafta-b84ce.iam.gserviceaccount.com` hesabını bulun
   - Veya "firebase-adminsdk" ile başlayan hesabı bulun

2. **Service account'a tıklayın:**
   - Hesabın adına tıklayarak detay sayfasına gidin

---

### Adım 3: Key Oluşturma

1. **"Keys" sekmesine gidin:**
   - Service account detay sayfasında üstteki "Keys" sekmesine tıklayın

2. **"Add Key" → "Create new key" seçin:**
   - "Add Key" butonuna tıklayın
   - Açılan menüden "Create new key" seçin

3. **Key formatını seçin:**
   - **JSON** formatını seçin (önerilen)
   - "Create" butonuna tıklayın

4. **Key dosyası indirilecek:**
   - JSON dosyası otomatik olarak indirilecek
   - Dosya adı: `pafta-b84ce-xxxxx-xxxxx.json` gibi bir şey olacak

---

### Adım 4: JSON Dosyasından Private Key Çıkarma

İndirdiğiniz JSON dosyasını açın. İçeriği şöyle olacak:

```json
{
  "type": "service_account",
  "project_id": "pafta-b84ce",
  "private_key_id": "xxxxx",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@pafta-b84ce.iam.gserviceaccount.com",
  "client_id": "xxxxx",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40pafta-b84ce.iam.gserviceaccount.com"
}
```

**ÖNEMLİ Değerler:**
- `private_key`: Edge Function'da `FIREBASE_PRIVATE_KEY` olarak kullanılacak
- `private_key_id`: Edge Function'da `FIREBASE_PRIVATE_KEY_ID` olarak kullanılacak
- `client_email`: Edge Function'da `FIREBASE_CLIENT_EMAIL` olarak kullanılacak
- `project_id`: Edge Function'da `FIREBASE_PROJECT_ID` olarak kullanılacak

---

## 🔐 Supabase Edge Function Secrets'a Ekleme

### Adım 1: Supabase Dashboard'a Giriş

1. **Supabase Dashboard:**
   - https://supabase.com/dashboard
   - Projenizi seçin

2. **Edge Functions → send-push-notification:**
   - Sol menüden "Edge Functions" seçin
   - `send-push-notification` function'ını bulun
   - "Settings" veya "Secrets" sekmesine gidin

---

### Adım 2: Secrets Ekleme/Güncelleme

1. **FIREBASE_PRIVATE_KEY:**
   - JSON dosyasındaki `private_key` değerini kopyalayın
   - **ÖNEMLİ:** `\n` karakterlerini koruyun (değiştirmeyin)
   - Supabase Dashboard'da `FIREBASE_PRIVATE_KEY` secret'ını ekleyin veya güncelleyin

2. **FIREBASE_PRIVATE_KEY_ID:**
   - JSON dosyasındaki `private_key_id` değerini kopyalayın
   - `FIREBASE_PRIVATE_KEY_ID` secret'ını ekleyin veya güncelleyin

3. **FIREBASE_CLIENT_EMAIL:**
   - JSON dosyasındaki `client_email` değerini kopyalayın
   - `FIREBASE_CLIENT_EMAIL` secret'ını ekleyin veya güncelleyin
   - Değer: `firebase-adminsdk-fbsvc@pafta-b84ce.iam.gserviceaccount.com`

4. **FIREBASE_PROJECT_ID:**
   - JSON dosyasındaki `project_id` değerini kopyalayın
   - `FIREBASE_PROJECT_ID` secret'ını ekleyin veya güncelleyin
   - Değer: `pafta-b84ce`

5. **FIREBASE_TOKEN_URI (Opsiyonel):**
   - JSON dosyasındaki `token_uri` değerini kopyalayın
   - `FIREBASE_TOKEN_URI` secret'ını ekleyin (opsiyonel, kodda default var)
   - Değer: `https://oauth2.googleapis.com/token`

---

## ⚠️ ÖNEMLİ NOTLAR

### 1. Private Key Formatı

Private key'deki `\n` karakterlerini **ASLA** değiştirmeyin:
- ✅ Doğru: `-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n`
- ❌ Yanlış: `-----BEGIN PRIVATE KEY-----MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...-----END PRIVATE KEY-----`

### 2. Güvenlik

- ✅ JSON dosyasını **ASLA** Git'e commit etmeyin
- ✅ JSON dosyasını güvenli bir yerde saklayın
- ✅ Service account key'leri düzenli olarak rotate edin (güvenlik için)

### 3. Key Rotation

Eğer key'i yeniden oluşturursanız:
1. Eski key'i silin (Google Cloud Console → Service Accounts → Keys)
2. Yeni key oluşturun
3. Supabase Edge Function secrets'ı güncelleyin
4. Edge function'ı yeniden deploy edin

---

## 🧪 Test

Secrets'ları ekledikten sonra:

1. **Edge Function'ı yeniden deploy edin:**
   ```bash
   supabase functions deploy send-push-notification
   ```

2. **Test edin:**
   - Edge function'ı çağırın
   - Logları kontrol edin
   - Access token başarıyla alınmalı

---

## 📝 Özet

1. Google Cloud Console → IAM & Admin → Service Accounts
2. `firebase-adminsdk-fbsvc@pafta-b84ce.iam.gserviceaccount.com` seçin
3. Keys → Add Key → Create new key → JSON
4. JSON dosyasını indirin
5. JSON'dan değerleri kopyalayın
6. Supabase Dashboard → Edge Functions → Secrets → Ekle/Güncelle

---

## 🔗 Hızlı Linkler

- **Google Cloud Console Service Accounts:**
  https://console.cloud.google.com/iam-admin/serviceaccounts?project=pafta-b84ce

- **Supabase Dashboard:**
  https://supabase.com/dashboard
