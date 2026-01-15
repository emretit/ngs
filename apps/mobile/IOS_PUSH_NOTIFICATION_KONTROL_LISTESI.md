# iOS Push Notification Kontrol Listesi

## 🔥 En Sık Yapılan Hatalar ve Kontroller

### 1. ❌ Sandbox Sertifikası Yüklemek
**Kontrol:**
- ✅ Firebase Console → Project Settings → Cloud Messaging → Apple app configuration
- ✅ **APNs Authentication Key** kullanılmalı (`.p8` dosyası)
- ❌ **APNs Certificates** (sandbox/production) kullanılmamalı
- ✅ Key ID ve Team ID doğru girilmiş olmalı

**Mevcut Durum:**
- Firebase Console'da APNs Authentication Key yüklü mü kontrol edin
- Key ID ve Team ID doğru mu kontrol edin

---

### 2. ❌ Wrong Bundle ID
**Kontrol:**
- ✅ Bundle ID: `com.pafta.mobile` (Xcode'da kontrol edin)
- ✅ GoogleService-Info.plist'te BUNDLE_ID: `com.pafta.mobile`
- ✅ Firebase Console'da iOS app Bundle ID: `com.pafta.mobile`
- ✅ Apple Developer Console'da App ID: `com.pafta.mobile` kayıtlı olmalı

**Mevcut Durum:**
- ✅ Bundle ID doğru: `com.pafta.mobile`
- ✅ GoogleService-Info.plist'te doğru: `com.pafta.mobile`

**Kontrol Adımları:**
1. Xcode'da: Runner target → General → Bundle Identifier
2. Firebase Console: Project Settings → Your apps → iOS app → Bundle ID
3. Apple Developer: Certificates, Identifiers & Profiles → Identifiers → App IDs

---

### 3. ❌ Push Notifications Capability Açık Değil
**Kontrol:**
- ✅ Xcode'da: Runner target → Signing & Capabilities
- ✅ "Push Notifications" capability eklenmiş olmalı
- ✅ "Background Modes" capability eklenmiş olmalı
  - ✅ "Remote notifications" seçeneği işaretli olmalı

**Mevcut Durum:**
- ✅ `Runner.entitlements` dosyasında `aps-environment` = `production` var
- ✅ `Info.plist`'te `UIBackgroundModes` → `remote-notification` var

**Kontrol Adımları:**
1. Xcode'da projeyi açın: `cd ios && open Runner.xcworkspace`
2. Runner target'ı seçin
3. "Signing & Capabilities" sekmesine gidin
4. "+ Capability" butonuna tıklayın
5. "Push Notifications" ekleyin
6. "Background Modes" ekleyin ve "Remote notifications" işaretleyin

---

### 4. ❌ Firebase'de Eski Sertifika Duruyor
**Kontrol:**
- ✅ Firebase Console → Project Settings → Cloud Messaging
- ✅ "Apple app configuration" bölümünde doğru app seçili mi?
- ✅ APNs Authentication Key güncel mi?
- ✅ Key ID ve Team ID doğru mu?

**Kontrol Adımları:**
1. Firebase Console'a gidin: https://console.firebase.google.com/
2. Projenizi seçin: `pafta-b84ce`
3. ⚙️ Settings → Project settings
4. "Cloud Messaging" sekmesine gidin
5. "Apple app configuration" bölümünde `com.pafta.mobile` seçin
6. APNs Authentication Key'in yüklü olduğunu kontrol edin
7. Eski certificate varsa silin, sadece APNs Authentication Key kullanın

---

## 🧪 Test Kontrolü

### ❌ Simulator Push Almaz
- ✅ **Gerçek iPhone şart!**
- ❌ iOS Simulator'da push notification test edilemez
- ✅ Test için mutlaka gerçek cihaz kullanın

### Test Adımları:
1. **Gerçek iPhone'da test edin:**
   ```bash
   flutter run --release
   # veya
   cd ios && xcodebuild -workspace Runner.xcworkspace -scheme Runner -configuration Release
   ```

2. **Uygulamayı açın ve login olun:**
   - FCM token'ın kaydedildiğini kontrol edin
   - Veritabanında `profiles` tablosunda `fcm_token` kontrol edin

3. **Servis ataması yapın:**
   - Web'den bir servis talebini teknisyene atayın
   - Push notification'ın geldiğini kontrol edin

---

## 📋 Hızlı Kontrol Listesi

### Xcode Kontrolleri:
- [ ] Bundle Identifier: `com.pafta.mobile`
- [ ] Push Notifications capability ekli
- [ ] Background Modes → Remote notifications aktif
- [ ] Signing & Capabilities → Team seçili
- [ ] `Runner.entitlements` → `aps-environment` = `production`

### Firebase Console Kontrolleri:
- [ ] APNs Authentication Key yüklü (`.p8` dosyası)
- [ ] Key ID doğru
- [ ] Team ID doğru
- [ ] Bundle ID: `com.pafta.mobile` eşleşiyor
- [ ] Eski certificate yok (sadece APNs Key olmalı)

### Apple Developer Console Kontrolleri:
- [ ] App ID: `com.pafta.mobile` kayıtlı
- [ ] Push Notifications capability aktif
- [ ] APNs Authentication Key oluşturulmuş
- [ ] Key ID not edilmiş
- [ ] Team ID not edilmiş

### Kod Kontrolleri:
- [ ] `GoogleService-Info.plist` güncel
- [ ] `Runner.entitlements` → `aps-environment` = `production`
- [ ] `Info.plist` → `UIBackgroundModes` → `remote-notification`
- [ ] `AppDelegate.swift` → APNS token handling var
- [ ] Firebase Messaging SDK kurulu

---

## 🔧 Sorun Giderme

### Push Notification Gelmiyorsa:

1. **FCM Token Kontrolü:**
   ```sql
   SELECT id, email, fcm_token, platform, last_token_updated 
   FROM profiles 
   WHERE id = 'USER_ID';
   ```

2. **Edge Function Logları:**
   - Supabase Dashboard → Edge Functions → send-push-notification → Logs
   - FCM API hatalarını kontrol edin

3. **Firebase Console Logları:**
   - Firebase Console → Cloud Messaging → Delivery reports
   - Başarısız gönderimleri kontrol edin

4. **Cihaz Kontrolleri:**
   - Bildirim izinleri açık mı? (Settings → Notifications)
   - Uygulama arka planda mı?
   - İnternet bağlantısı var mı?

---

## 📝 Notlar

- ⚠️ **Sandbox sertifikası kullanmayın!** APNs Authentication Key kullanın
- ⚠️ **Simulator'da test etmeyin!** Gerçek cihaz şart
- ✅ Production key hem development hem production için çalışır
- ✅ Key yüklendikten sonra uygulamayı yeniden build edin
- ✅ Bundle ID değişikliğinden sonra Firebase'de güncelleyin
