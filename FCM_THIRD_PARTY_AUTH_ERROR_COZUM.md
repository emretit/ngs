# FCM THIRD_PARTY_AUTH_ERROR Çözüm Rehberi

## 🔴 Sorun
"THIRD_PARTY_AUTH_ERROR" hatası alınıyor. Bu, service account'un FCM API'ye erişim izni olmadığı anlamına geliyor.

## ✅ Kontrol Edilmesi Gerekenler

### 1. Firebase Cloud Messaging API Etkin mi?

**Kritik:** Roller ekli olsa bile, API etkin değilse çalışmaz!

#### Adımlar:
1. **Google Cloud Console:**
   - https://console.cloud.google.com
   - Proje: `pafta-b84ce` seçin

2. **API & Services → Enabled APIs:**
   - Sol menüden "API & Services" → "Enabled APIs" seçin
   - Arama kutusuna **"Firebase Cloud Messaging API"** yazın
   - **Eğer listede yoksa veya "DISABLED" yazıyorsa:**
     - "API & Services" → "Library" seçin
     - "Firebase Cloud Messaging API" arayın
     - "Enable" butonuna tıklayın

3. **Alternatif Kontrol:**
   - API & Services → Dashboard
   - "Firebase Cloud Messaging API" için istek sayısını kontrol edin
   - Eğer 0 ise, API etkin değil demektir

---

### 2. Service Account Rollerini Tekrar Kontrol Et

1. **Google Cloud Console:**
   - IAM & Admin → IAM
   - `firebase-adminsdk-fbsvc@pafta-b84ce.iam.gserviceaccount.com` arayın

2. **Kontrol Edilmesi Gereken Roller:**
   - ✅ Firebase Cloud Messaging Admin
   - ✅ Firebase Admin (veya Firebase Admin SDK Administrator Service Agent)
   - ✅ Service Account Token Creator

3. **Eğer Roller Eksikse:**
   - Service account'a tıklayın
   - "Edit" butonuna tıklayın
   - "Add Another Role" → "Firebase Cloud Messaging Admin" ekleyin
   - "Save" butonuna tıklayın

---

### 3. Service Account Key Doğruluğu

Edge function'da kullanılan service account ile Google Cloud Console'daki service account eşleşmeli.

**Kontrol:**
- Supabase Dashboard → Edge Functions → `send-push-notification` → Secrets
- `FIREBASE_CLIENT_EMAIL` değeri: `firebase-adminsdk-fbsvc@pafta-b84ce.iam.gserviceaccount.com`
- Google Cloud Console'daki service account email'i ile eşleşmeli

---

### 4. API Etkinleştirme Sonrası Bekleme

API etkinleştirildikten sonra:
- **5-10 dakika** bekleyin (propagation için)
- Edge function'ı yeniden test edin

---

## 🔧 Adım Adım Çözüm

### Adım 1: API'yi Etkinleştir

1. Google Cloud Console → API & Services → Library
2. "Firebase Cloud Messaging API" arayın
3. "Enable" butonuna tıklayın
4. **5-10 dakika bekleyin**

### Adım 2: Service Account Rollerini Kontrol Et

1. Google Cloud Console → IAM & Admin → IAM
2. `firebase-adminsdk-fbsvc@pafta-b84ce.iam.gserviceaccount.com` bulun
3. Rollerini kontrol edin:
   - Firebase Cloud Messaging Admin ✅
   - Firebase Admin ✅
   - Service Account Token Creator ✅

### Adım 3: Edge Function'ı Test Et

```bash
# Edge function'ı test edin
supabase functions invoke send-push-notification \
  --body '{"user_id": "test-user-id", "title": "Test", "body": "Test mesajı"}'
```

### Adım 4: Logları Kontrol Et

- Supabase Dashboard → Edge Functions → Logs
- 401 hatası kaybolmalı
- Access token başarıyla alınmalı
- FCM API'ye istek başarılı olmalı

---

## 🎯 En Olası Neden

**Firebase Cloud Messaging API etkin değil!**

Roller ekli olsa bile, API etkin değilse service account FCM API'ye erişemez.

---

## 📝 Kontrol Listesi

- [ ] Firebase Cloud Messaging API etkin mi? (API & Services → Enabled APIs)
- [ ] Service account'a "Firebase Cloud Messaging Admin" rolü ekli mi?
- [ ] Service account'a "Firebase Admin" rolü ekli mi?
- [ ] Service account email'i doğru mu? (`firebase-adminsdk-fbsvc@pafta-b84ce.iam.gserviceaccount.com`)
- [ ] Edge Function secrets doğru mu?
- [ ] API etkinleştirildikten sonra 5-10 dakika beklendi mi?

---

## 🔗 Hızlı Linkler

- **Google Cloud Console - Enabled APIs:**
  https://console.cloud.google.com/apis/library?project=pafta-b84ce

- **Google Cloud Console - IAM:**
  https://console.cloud.google.com/iam-admin/iam?project=pafta-b84ce

- **Firebase Cloud Messaging API (Direkt):**
  https://console.cloud.google.com/apis/library/fcm.googleapis.com?project=pafta-b84ce
