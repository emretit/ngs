# Yeni Build Oluşturma Rehberi - Push Notification Düzeltmeleri

## 🎯 Amaç

App Store'daki mevcut build eski olduğu için son push notification düzeltmeleri production'da yok. Yeni bir build oluşturup App Store'a yüklemek gerekiyor.

---

## 📋 Son Yapılan Değişiklikler (Yeni Build'de Olacak)

### 1. ✅ APNs Token Bekleme Süresi Artırıldı
- **Eski:** 10 saniye
- **Yeni:** 20 saniye (App Store build'inde daha uzun bekleme)

### 2. ✅ APNs Token Kontrolü Eklendi
- FCM token kaydedilirken APNs token kontrol ediliyor
- APNs token yoksa uyarı mesajı gösteriliyor

### 3. ✅ Detaylı Loglar Eklendi
- AppDelegate.swift'te daha detaylı APNs token logları
- FCM token kaydetme sırasında APNs token kontrolü
- Hata durumlarında daha açıklayıcı mesajlar

### 4. ✅ App Store Build İçin Özel Uyarılar
- APNs token yoksa Firebase Console kontrolü hatırlatması
- Bundle ID ve Team ID kontrolü hatırlatması

---

## 🚀 Yeni Build Oluşturma Adımları

### Adım 1: Version ve Build Number Güncelleme

**Mevcut Version:** `1.0.3+1`

**Yeni Version:** `1.0.4+2` (veya daha yüksek)

```bash
cd apps/mobile
# pubspec.yaml dosyasını düzenleyin
# version: 1.0.4+2
```

### Adım 2: Flutter Clean ve Dependencies

```bash
cd apps/mobile
flutter clean
flutter pub get
cd ios
pod install
cd ..
```

### Adım 3: Release Build Oluşturma

**Seçenek 1: Flutter ile (Önerilen)**
```bash
cd apps/mobile
flutter build ipa --release
```

**Seçenek 2: Xcode ile**
1. Xcode'da `ios/Runner.xcworkspace` açın
2. Product > Scheme > Runner seçin
3. Product > Destination > Any iOS Device seçin
4. Product > Archive
5. Archive tamamlandığında Organizer penceresi açılır
6. "Distribute App" butonuna tıklayın
7. "App Store Connect" seçin
8. "Upload" seçin
9. Signing ayarlarını kontrol edin
10. "Upload" butonuna tıklayın

**Seçenek 3: Fastlane ile (Otomatik)**
```bash
cd apps/mobile
fastlane ios beta  # TestFlight için
# veya
fastlane ios release  # App Store için
```

---

## 📤 App Store Connect'e Yükleme

### 1. TestFlight'a Yükleme (Önerilen - Önce Test Edin)

1. **Xcode Organizer'dan:**
   - Archive tamamlandığında "Distribute App" butonuna tıklayın
   - "App Store Connect" seçin
   - "Upload" seçin
   - Signing ayarlarını kontrol edin
   - "Upload" butonuna tıklayın

2. **App Store Connect'te:**
   - Build'in işlenmesini bekleyin (10-30 dakika)
   - TestFlight sekmesine gidin
   - Build hazır olduğunda test kullanıcıları ekleyin
   - Test edin

### 2. App Store'a Yükleme (Production)

1. **App Store Connect'te:**
   - "App Store" sekmesine gidin
   - "+ Version" butonuna tıklayın
   - Version number: `1.0.4` (veya yeni version)
   - Build seçin (yüklediğiniz build'i seçin)
   - "Submit for Review" butonuna tıklayın

---

## ✅ Build Öncesi Kontrol Listesi

### Xcode Kontrolleri:
- [ ] Bundle Identifier: `com.pafta.mobile`
- [ ] Push Notifications capability ekli
- [ ] Background Modes → Remote notifications aktif
- [ ] Signing & Capabilities → Team seçili (T9QCW8Q2C3)
- [ ] `Runner.entitlements` → `aps-environment` = `production`
- [ ] Version: `1.0.4` (veya yeni)
- [ ] Build Number: `2` (veya yeni)

### Firebase Console Kontrolleri:
- [ ] APNs Authentication Key yüklü (`.p8` dosyası)
- [ ] Key ID doğru
- [ ] Team ID doğru
- [ ] Bundle ID: `com.pafta.mobile` eşleşiyor

### Kod Kontrolleri:
- [ ] `pubspec.yaml` → version güncellendi
- [ ] `firebase_messaging_service.dart` → APNs token bekleme süresi 20 saniye
- [ ] `AppDelegate.swift` → Detaylı loglar eklendi
- [ ] `GoogleService-Info.plist` güncel

---

## 🧪 Test Adımları

### 1. TestFlight'ta Test (Önerilen)

1. **Yeni build'i TestFlight'a yükleyin**
2. **Test kullanıcıları ekleyin**
3. **TestFlight'tan uygulamayı indirin**
4. **Login olun**
5. **Xcode Console'da logları kontrol edin:**
   - `✅ APNS token alındı` mesajı var mı?
   - `✅ FCM registration token` mesajı var mı?
   - Hata mesajları var mı?
6. **Bir servis ataması yapın**
7. **Push notification'ın gelip gelmediğini kontrol edin**

### 2. Production'da Test

1. **App Store'dan uygulamayı indirin**
2. **Login olun**
3. **Bir servis ataması yapın**
4. **Push notification'ın gelip gelmediğini kontrol edin**

---

## 🔍 Sorun Giderme

### Build Başarısız Olursa

1. **Flutter clean yapın:**
   ```bash
   cd apps/mobile
   flutter clean
   flutter pub get
   cd ios
   pod install
   cd ..
   ```

2. **Xcode'da projeyi temizleyin:**
   - Xcode'da: Product > Clean Build Folder (Shift + Cmd + K)

3. **Derived Data'yı temizleyin:**
   - Xcode'da: Preferences > Locations > Derived Data → Delete

### Upload Başarısız Olursa

1. **Signing ayarlarını kontrol edin:**
   - Xcode'da: Runner target → Signing & Capabilities
   - Team seçili olmalı
   - Bundle ID doğru olmalı

2. **Provisioning Profile kontrolü:**
   - Apple Developer Console'da App ID kontrol edin
   - Push Notifications capability aktif olmalı

---

## 📝 Notlar

- ⚠️ **Yeni build oluşturmadan önce tüm değişikliklerin commit edildiğinden emin olun**
- ✅ **TestFlight'ta test etmeden production'a yüklemeyin**
- ✅ **Build number her yüklemede artmalı**
- ✅ **Version number sadece önemli değişikliklerde artırılmalı**
- ✅ **Gerçek cihazda test edin** - Simulator push notification almaz

---

## 🚨 Acil Durum

Eğer production'da acil bir düzeltme gerekiyorsa:

1. **Hızlı build oluşturun:**
   ```bash
   cd apps/mobile
   flutter clean
   flutter pub get
   cd ios && pod install && cd ..
   flutter build ipa --release
   ```

2. **Xcode'da Archive oluşturun:**
   - Product > Archive
   - Distribute App → App Store Connect → Upload

3. **App Store Connect'te:**
   - TestFlight'a yükleyin
   - Hızlı test yapın
   - Production'a yükleyin

---

## 📞 Destek

Sorun yaşarsanız:
1. Xcode Console loglarını kontrol edin
2. Edge Function loglarını kontrol edin (Supabase Dashboard)
3. Firebase Console loglarını kontrol edin
4. Build loglarını kontrol edin
