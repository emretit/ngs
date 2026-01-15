# FCM Push Notification Hata Analizi

## 📋 Özet

Firebase Cloud Messaging (FCM) push notification sistemi **401 UNAUTHENTICATED** hatası veriyor.

**ÖNEMLİ:** Local'de Flutter uygulaması çalıştırıldığında push notification geliyor. Bu durumda:
- ✅ APNs Authentication Key doğru yapılandırılmış
- ✅ Firebase yapılandırması doğru
- ✅ Flutter uygulaması FCM token alabiliyor
- ❌ **Sorun sadece Edge Function'daki service account izinlerinde**

**Fark:**
- **Flutter App (Local):** Firebase SDK kullanıyor (client-side) → Çalışıyor ✅
- **Edge Function:** Firebase Admin SDK kullanıyor (server-side, service account) → 401 hatası ❌

---

## 🔍 Adım Adım Analiz

### 1. Access Token Alma Süreci ✅

**Durum:** Başarılı

Loglardan görülen:
```
🔑 Access token başarıyla alındı
🔑 Access token uzunluk: 1024
🔑 Access token ilk 20 karakter: ya29.c.c0AZ1aNiUlsZa
```

**Analiz:**
- JWT başarıyla oluşturuluyor (720 karakter)
- OAuth 2.0 token endpoint'e istek gönderiliyor
- Access token başarıyla alınıyor (1024 karakter)
- Token formatı doğru görünüyor (`ya29.c...` formatı Google OAuth token formatı)

**Sonuç:** Access token alma süreci çalışıyor.

---

### 2. FCM API İsteği ❌

**Durum:** Başarısız - 401 UNAUTHENTICATED

**Hata Detayları:**
```json
{
  "error": {
    "code": 401,
    "message": "Request is missing required authentication credential. Expected OAuth 2 access token, login cookie or other valid authentication credential.",
    "status": "UNAUTHENTICATED",
    "details": [
      {
        "@type": "type.googleapis.com/google.firebase.fcm.v1.FcmError",
        "errorCode": "THIRD_PARTY_AUTH_ERROR"
      },
      {
        "@type": "type.googleapis.com/google.firebase.fcm.v1.ApnsError",
        "statusCode": 403,
        "reason": "InvalidProviderToken"
      }
    ]
  }
}
```

**Analiz:**
- Access token alınıyor ama FCM API tarafından kabul edilmiyor
- **THIRD_PARTY_AUTH_ERROR**: Service account'un FCM API izinleri eksik
- **InvalidProviderToken** hatası muhtemelen yan etki - APNs key zaten doğru çalışıyor (local'de bildirim geliyor)

**Olası Nedenler:**
1. ✅ **Service account (`firebase-adminsdk-fbsvc@pafta-b84ce.iam.gserviceaccount.com`) FCM API'ye erişim izni yok**
2. ✅ **Service account'a "Firebase Cloud Messaging Admin" rolü atanmamış**
3. ✅ **Firebase Cloud Messaging API etkin değil**
4. ❌ APNs Authentication Key (.p8) - **Bu doğru çalışıyor (local test başarılı)**

---

### 3. Service Account İzinleri Kontrolü 🔐

**Service Account:** `firebase-adminsdk-fbsvc@pafta-b84ce.iam.gserviceaccount.com`

**Gerekli İzinler:**
1. ✅ **Firebase Admin SDK** - Service account oluşturulmuş
2. ❓ **Firebase Cloud Messaging Admin** - Kontrol edilmeli
3. ❓ **Firebase Cloud Messaging API** - Etkin olmalı

**Kontrol Edilmesi Gerekenler:**
- Google Cloud Console → IAM & Admin → Service Accounts
- Service account'a "Firebase Cloud Messaging Admin" rolü eklenmeli
- API & Services → Enabled APIs → "Firebase Cloud Messaging API" etkin olmalı

---

### 4. APNs (Apple Push Notification Service) Konfigürasyonu ✅

**Durum:** Doğru yapılandırılmış (Local test başarılı)

**Not:** Local'de Flutter uygulaması çalıştırıldığında push notification geliyor. Bu durumda:
- ✅ APNs Authentication Key (.p8) doğru yapılandırılmış
- ✅ Key ID ve Team ID doğru
- ✅ Bundle ID (`com.pafta.mobile`) eşleşiyor
- ✅ Firebase Console yapılandırması doğru

**InvalidProviderToken hatası muhtemelen:**
- Service account'un FCM API'ye erişim izni olmadığı için yan etki olarak görünüyor
- Service account izinleri düzeltildiğinde bu hata da kaybolacak

---

## 🔧 Çözüm Adımları

### Adım 1: Service Account İzinlerini Kontrol Et

1. **Google Cloud Console'a gidin:**
   - https://console.cloud.google.com
   - Proje: `pafta-b84ce`

2. **IAM & Admin → Service Accounts:**
   - `firebase-adminsdk-fbsvc@pafta-b84ce.iam.gserviceaccount.com` bulun
   - "Edit" (Düzenle) butonuna tıklayın

3. **Rol Ekleme:**
   - "Add Another Role" butonuna tıklayın
   - Aşağıdaki rollerden birini ekleyin:
     - ✅ `Firebase Cloud Messaging Admin` (önerilen)
     - ✅ `Firebase Admin` (daha geniş izinler)

4. **API Kontrolü:**
   - API & Services → Enabled APIs
   - "Firebase Cloud Messaging API" arayın
   - Etkin değilse "Enable" butonuna tıklayın

---

### Adım 2: APNs Authentication Key Kontrolü ⚠️

**Not:** Local test başarılı olduğu için APNs key zaten doğru yapılandırılmış. Bu adımı atlayabilirsiniz.

Eğer hala sorun yaşıyorsanız:

1. **Firebase Console'a gidin:**
   - https://console.firebase.google.com
   - Proje: `pafta-b84ce`

2. **Project Settings → Cloud Messaging:**
   - "Cloud Messaging" sekmesine gidin
   - "Apple app configuration" bölümüne gidin
   - `com.pafta.mobile` uygulamasını seçin

3. **APNs Authentication Key Kontrolü:**
   - APNs Authentication Key (.p8) yüklü mü kontrol edin
   - Key ID ve Team ID doğru mu kontrol edin

---

### Adım 3: Edge Function Environment Variables Kontrolü

Edge function'da kullanılan environment variable'lar:

```typescript
FIREBASE_PRIVATE_KEY        // Service account private key
FIREBASE_PRIVATE_KEY_ID     // Private key ID
FIREBASE_CLIENT_EMAIL       // firebase-adminsdk-fbsvc@pafta-b84ce.iam.gserviceaccount.com
FIREBASE_PROJECT_ID         // pafta-b84ce
FIREBASE_TOKEN_URI          // https://oauth2.googleapis.com/token (opsiyonel)
```

**Kontrol:**
- Supabase Dashboard → Edge Functions → `send-push-notification` → Secrets
- Tüm environment variable'ların doğru ayarlandığından emin olun

---

## 📊 Hata Öncelik Sırası

**ÖNEMLİ:** Local'de bildirim geldiği için APNs key zaten doğru. Sorun sadece service account izinlerinde.

1. **🔴 KRİTİK ÖNCELİK (Tek Sorun Bu):**
   - ✅ Service account'a "Firebase Cloud Messaging Admin" rolü ekle
   - ✅ Firebase Cloud Messaging API'yi etkinleştir
   - ✅ Google Cloud Console → IAM & Admin → Service Accounts → İzinleri kontrol et

2. **🟡 DÜŞÜK ÖNCELİK (Zaten Çalışıyor):**
   - ⚠️ APNs Authentication Key - Local test başarılı, sorun yok
   - ⚠️ Edge function environment variable'larını kontrol et (muhtemelen doğru)

---

## 🧪 Test Adımları

Çözümler uygulandıktan sonra:

1. **Edge Function'ı test edin:**
   ```bash
   # Supabase CLI ile test
   supabase functions invoke send-push-notification \
     --body '{"user_id": "test-user-id", "title": "Test", "body": "Test mesajı"}'
   ```

2. **Logları kontrol edin:**
   - Supabase Dashboard → Edge Functions → Logs
   - 401 hatası kaybolmalı
   - Başarılı response alınmalı

3. **Mobil uygulamada test:**
   - iOS uygulamasında push notification alınmalı
   - Bildirim veritabanına kaydedilmeli

---

## 📝 Notlar

- ✅ **Local'de Flutter uygulaması çalıştırıldığında push notification geliyor**
- ✅ **APNs Authentication Key doğru yapılandırılmış (local test başarılı)**
- ✅ Access token alma süreci çalışıyor, sorun izinlerde
- ✅ Bildirimler veritabanına kaydediliyor (FCM hatası olsa bile)
- ❌ **Tek sorun: Service account'un FCM API'ye erişim izni yok**
- 🔧 Service account izinleri Google Cloud Console'dan yönetiliyor

**Fark:**
- **Flutter App:** Firebase SDK (client-side) → Çalışıyor ✅
- **Edge Function:** Firebase Admin SDK (server-side, service account) → İzin hatası ❌

---

## 🔗 İlgili Dokümantasyon

- [Firebase Cloud Messaging Admin SDK](https://firebase.google.com/docs/cloud-messaging/admin/send-messages)
- [Google Cloud IAM Service Accounts](https://cloud.google.com/iam/docs/service-accounts)
- [APNs Authentication Key Setup](https://firebase.google.com/docs/cloud-messaging/ios/certificates)
- [Supabase Edge Functions Secrets](https://supabase.com/docs/guides/functions/secrets)
