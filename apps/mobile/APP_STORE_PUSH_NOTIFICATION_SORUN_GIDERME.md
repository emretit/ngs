# App Store Build Push Notification Sorun Giderme

## 🔍 Sorun: App Store Build'inde Push Notification Çalışmıyor

### Durum
- ✅ Local build'de push notification çalışıyor
- ✅ FCM token veritabanına kaydediliyor
- ✅ Edge Function başarılı (200 status)
- ❌ App Store build'inde push notification gelmiyor

---

## 🔥 Olası Nedenler ve Çözümler

### 1. ❌ Firebase Console'da APNs Authentication Key Eksik/Yanlış

**Kontrol:**
1. Firebase Console → Project Settings → Cloud Messaging
2. Apple app configuration → `com.pafta.mobile` seçin
3. **APNs Authentication Key** bölümünde:
   - ✅ `.p8` dosyası yüklü olmalı
   - ✅ Key ID doğru girilmiş olmalı
   - ✅ Team ID doğru girilmiş olmalı
   - ✅ Bundle ID: `com.pafta.mobile` eşleşmeli
   - ❌ Eski APNs sertifikaları (`.p12`) olmamalı

**Çözüm:**
1. Apple Developer Console → Keys
2. APNs Authentication Key oluşturun (`.p8`)
3. Key ID ve Team ID'yi not edin
4. Firebase Console'a yükleyin

---

### 2. ❌ App Store Build'inde APNs Token Alınamıyor

**Kontrol:**
- App Store build'inde `didRegisterForRemoteNotificationsWithDeviceToken` çağrılıyor mu?
- `didFailToRegisterForRemoteNotificationsWithError` hatası var mı?

**Çözüm:**
1. Xcode'da projeyi açın: `cd ios && open Runner.xcworkspace`
2. Runner target → Signing & Capabilities
3. **Push Notifications** capability ekli olmalı
4. **Background Modes** → **Remote notifications** işaretli olmalı
5. `Runner.entitlements` → `aps-environment` = `production` olmalı

---

### 3. ❌ Bundle ID veya Signing Farkı

**Kontrol:**
- App Store build'inde Bundle ID: `com.pafta.mobile` mi?
- Firebase Console'da Bundle ID eşleşiyor mu?
- Apple Developer Console'da App ID kayıtlı mı?

**Çözüm:**
1. Xcode'da: Runner target → General → Bundle Identifier
2. `com.pafta.mobile` olduğundan emin olun
3. Firebase Console'da Bundle ID kontrol edin
4. Apple Developer Console'da App ID kontrol edin

---

### 4. ❌ App Store Build'inde FCM Token Kaydedilmiyor

**Kontrol:**
```sql
SELECT id, email, fcm_token, platform, last_token_updated 
FROM profiles 
WHERE id = 'USER_ID';
```

**Çözüm:**
- App Store build'inde uygulamayı açın ve login olun
- FCM token'ın kaydedildiğini kontrol edin
- Logları kontrol edin (Xcode Console veya device logs)

---

## 🧪 Test Adımları

### 1. App Store Build'inde FCM Token Kontrolü

1. **App Store'dan uygulamayı indirin**
2. **Login olun**
3. **FCM token'ın kaydedildiğini kontrol edin:**
   ```sql
   SELECT id, email, fcm_token, platform, last_token_updated 
   FROM profiles 
   WHERE email = 'emre@ngsteknoloji.com';
   ```

### 2. Edge Function Logları Kontrolü

1. **Supabase Dashboard → Edge Functions → send-push-notification → Logs**
2. **FCM API hatalarını kontrol edin**
3. **APNs InvalidProviderToken hatası var mı?**

### 3. Firebase Console Logları

1. **Firebase Console → Cloud Messaging → Delivery reports**
2. **Başarısız gönderimleri kontrol edin**
3. **APNs Authentication Key durumunu kontrol edin**

---

## 📋 Hızlı Kontrol Listesi

### Firebase Console:
- [ ] APNs Authentication Key yüklü (`.p8` dosyası)
- [ ] Key ID doğru
- [ ] Team ID doğru
- [ ] Bundle ID: `com.pafta.mobile` eşleşiyor
- [ ] Eski certificate yok (sadece APNs Key olmalı)

### Apple Developer Console:
- [ ] App ID: `com.pafta.mobile` kayıtlı
- [ ] Push Notifications capability aktif
- [ ] APNs Authentication Key oluşturulmuş
- [ ] Key ID not edilmiş
- [ ] Team ID not edilmiş

### Xcode:
- [ ] Bundle Identifier: `com.pafta.mobile`
- [ ] Push Notifications capability ekli
- [ ] Background Modes → Remote notifications aktif
- [ ] Signing & Capabilities → Team seçili
- [ ] `Runner.entitlements` → `aps-environment` = `production`

### App Store Build:
- [ ] FCM token kaydediliyor
- [ ] APNs token alınıyor (Xcode Console logları)
- [ ] Push notification izinleri verildi
- [ ] Uygulama gerçek cihazda test edildi (simulator değil)

---

## 🔧 Sorun Giderme Adımları

### Adım 1: Firebase Console'da APNs Authentication Key Kontrolü

1. Firebase Console → Project Settings → Cloud Messaging
2. Apple app configuration → `com.pafta.mobile` seçin
3. APNs Authentication Key bölümünde:
   - Key yüklü mü?
   - Key ID doğru mu?
   - Team ID doğru mu?
   - Bundle ID eşleşiyor mu?

### Adım 2: Apple Developer Console Kontrolü

1. https://developer.apple.com/account/ → Keys
2. APNs Authentication Key'in:
   - APNs enabled olduğundan
   - Revoke edilmediğinden
   - Key ID ve Team ID'nin doğru olduğundan emin olun

### Adım 3: App Store Build'inde Test

1. App Store'dan uygulamayı indirin
2. Login olun
3. Xcode Console'da logları kontrol edin:
   - `APNS token alındı` mesajı var mı?
   - `FCM registration token` mesajı var mı?
   - Hata mesajları var mı?

### Adım 4: Edge Function Logları Kontrolü

1. Supabase Dashboard → Edge Functions → send-push-notification → Logs
2. Son çalıştırmaları kontrol edin:
   - FCM API başarılı mı? (200 status)
   - APNs InvalidProviderToken hatası var mı?
   - THIRD_PARTY_AUTH_ERROR hatası var mı?

---

## 📝 Notlar

- ⚠️ **App Store build'i production APNs kullanır** - Development key çalışmaz!
- ⚠️ **APNs Authentication Key hem development hem production için çalışır** - Aynı key'i kullanabilirsiniz
- ✅ **Production key yüklendikten sonra uygulamayı yeniden build edin**
- ✅ **Bundle ID değişikliğinden sonra Firebase'de güncelleyin**
- ✅ **Gerçek cihazda test edin** - Simulator push notification almaz

---

## 🚨 Acil Durum Çözümü

Eğer App Store build'inde push notification çalışmıyorsa:

1. **Firebase Console'da APNs Authentication Key'i yeniden yükleyin:**
   - Eski key'i silin
   - Yeni key oluşturun (Apple Developer Console)
   - Firebase Console'a yükleyin

2. **App Store build'ini yeniden yayınlayın:**
   - Yeni build oluşturun
   - App Store Connect'e yükleyin
   - TestFlight'ta test edin

3. **Edge Function loglarını kontrol edin:**
   - Supabase Dashboard → Edge Functions → send-push-notification → Logs
   - Hata mesajlarını kontrol edin
