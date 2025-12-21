# App Store'a Yayınlama Rehberi - Pafta.App iOS

## ÖN HAZIRLIKLAR

### 1. Apple Developer Hesabı Kontrolü
- ✅ Apple Developer Program üyeliğiniz olmalı (yıllık $99)
- ✅ Hesabınız aktif ve ödeme yapılmış olmalı
- ✅ Development Team ID: `T9QCW8Q2C3` (zaten ayarlanmış)

### 2. Gerekli Bilgileri Toplama
- App adı: **Pafta.App**
- Bundle Identifier: `com.pafta.mobile` (değiştirilecek - com.example kullanılamaz)
- Version: 1.0.0
- Build Number: 1

---

## ADIM 1: Bundle Identifier Güncelleme

Bundle Identifier'ı App Store için uygun bir formata güncellememiz gerekiyor.

**ÖNEMLİ:** Bundle Identifier'ı değiştirmeden önce Apple Developer Console'da bu ID'yi kaydetmeniz gerekiyor.

---

## ADIM 2: App Store Connect'te Uygulama Oluşturma

1. **App Store Connect'e giriş yapın:**
   - https://appstoreconnect.apple.com adresine gidin
   - Apple Developer hesabınızla giriş yapın

2. **Yeni uygulama oluşturun:**
   - "My Apps" > "+" butonuna tıklayın
   - Platform: iOS seçin
   - Name: **Pafta.App**
   - Primary Language: Türkçe (veya uygun dil)
   - Bundle ID: Yeni bir App ID oluşturun veya mevcut birini seçin
     - Önerilen: `com.pafta.mobile`
   - SKU: Benzersiz bir SKU (örn: `pafta-mobile-001`)
   - User Access: Full Access (veya uygun seçenek)

3. **App ID oluşturma (gerekirse):**
   - https://developer.apple.com/account/resources/identifiers/list adresine gidin
   - "+" butonuna tıklayın
   - "App IDs" seçin
   - Bundle ID: `com.pafta.mobile` girin
   - Capabilities: Push Notifications, Background Modes seçin
   - Kaydedin

---

## ADIM 3: Xcode Proje Ayarları

### 3.1 Bundle Identifier Güncelleme
Xcode'da veya proje dosyasında bundle identifier'ı güncelleyin.

### 3.2 Signing & Capabilities
1. Xcode'da `ios/Runner.xcworkspace` dosyasını açın
2. Runner target'ını seçin
3. "Signing & Capabilities" sekmesine gidin
4. **Automatically manage signing** işaretli olmalı
5. Team: Development Team'inizi seçin (T9QCW8Q2C3)
6. Bundle Identifier: `com.pafta.mobile` olarak ayarlayın

### 3.3 Entitlements
- Push Notifications için `aps-environment` production olarak ayarlanmalı

---

## ADIM 4: Uygulama Bilgilerini Hazırlama

App Store Connect'te doldurmanız gereken bilgiler:

### 4.1 App Information
- **Name:** Pafta.App
- **Subtitle:** (opsiyonel)
- **Category:** Business veya Productivity
- **Privacy Policy URL:** (zorunlu - hazırlamanız gerekiyor)

### 4.2 Pricing and Availability
- **Price:** Ücretsiz veya ücretli
- **Availability:** Hangi ülkelerde yayınlanacak

### 4.3 App Privacy
- **Privacy Policy:** Hazırlamanız gerekiyor
- **Data Collection:** Uygulamanızın topladığı verileri belirtin
  - Konum verileri (Google Maps kullanıyorsunuz)
  - Kullanıcı içeriği
  - vb.

### 4.4 Screenshots ve App Preview
- **iPhone Screenshots:** Farklı ekran boyutları için (6.7", 6.5", 5.5")
- **iPad Screenshots:** (eğer iPad desteği varsa)
- **App Preview Video:** (opsiyonel)

### 4.5 App Description
- **Description:** Uygulamanızın açıklaması (Türkçe ve İngilizce)
- **Keywords:** Arama için anahtar kelimeler
- **Support URL:** Destek sayfası URL'i
- **Marketing URL:** (opsiyonel)

---

## ADIM 5: Build Hazırlama

### 5.1 Flutter Clean ve Build
```bash
cd /Users/emreaydin/paftamobile
flutter clean
flutter pub get
cd ios
pod install
cd ..
```

### 5.2 Release Build Oluşturma
```bash
flutter build ipa --release
```

Bu komut `build/ios/ipa/` klasöründe `.ipa` dosyası oluşturur.

### 5.3 Alternatif: Xcode ile Archive
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

---

## ADIM 6: TestFlight ile Test

1. Build yüklendikten sonra App Store Connect'te:
   - "TestFlight" sekmesine gidin
   - Build'in işlenmesini bekleyin (10-30 dakika)
   - Build hazır olduğunda test kullanıcıları ekleyin

2. **Internal Testing:**
   - Internal test kullanıcıları otomatik olarak eklenir
   - 100 kişiye kadar

3. **External Testing:**
   - Beta test için dış kullanıcılar ekleyin
   - Apple'ın incelemesinden geçmesi gerekir (1-2 gün)

---

## ADIM 7: App Store'a Gönderme

1. App Store Connect'te "App Store" sekmesine gidin
2. "+ Version" butonuna tıklayın
3. Version number: 1.0.0
4. Build seçin (yüklediğiniz build'i seçin)
5. Tüm bilgileri doldurun:
   - Screenshots
   - Description
   - Keywords
   - Support URL
   - Privacy Policy URL
   - vb.
6. "Submit for Review" butonuna tıklayın
7. Export Compliance sorularını cevaplayın
8. Content Rights sorularını cevaplayın
9. Advertising Identifier kullanıyorsanız belirtin

---

## ADIM 8: İnceleme Süreci

- **İnceleme süresi:** Genellikle 24-48 saat
- **Durum takibi:** App Store Connect'te "App Review" sekmesinden
- **Red durumunda:** Apple'dan detaylı geri bildirim gelir, düzeltip tekrar gönderebilirsiniz

---

## ÖNEMLİ NOTLAR

1. **Bundle Identifier:** `com.example.paftaMobile` kullanılamaz, mutlaka değiştirin
2. **Privacy Policy:** App Store zorunlu kılıyor, mutlaka hazırlayın
3. **Screenshots:** Farklı cihaz boyutları için hazırlayın
4. **Version Number:** Her yeni build için artırın (1.0.0+1, 1.0.1+2, vb.)
5. **Build Number:** Her yüklemede artmalı
6. **Push Notifications:** Production certificate gerekli
7. **Google Maps:** API key'in production için ayarlı olduğundan emin olun

---

## SIK KARŞILAŞILAN SORUNLAR

### "Invalid Bundle Identifier"
- Bundle ID'yi Apple Developer Console'da kaydetmeyi unutmayın

### "Missing Compliance"
- Export Compliance sorularını cevaplayın
- Encryption kullanmıyorsanız "No" seçin

### "Missing Privacy Policy"
- Privacy Policy URL'i zorunlu, mutlaka ekleyin

### "Invalid Binary"
- Build sırasında hata varsa kontrol edin
- Minimum iOS version uyumluluğunu kontrol edin

---

## YARDIMCI KOMUTLAR

```bash
# Flutter versiyon kontrolü
flutter --version

# iOS build kontrolü
flutter build ios --release

# IPA oluşturma
flutter build ipa --release

# Xcode projesini temizleme
cd ios
rm -rf Pods Podfile.lock
pod install
cd ..
```

---

## SONRAKI ADIMLAR

1. Bundle Identifier'ı güncelleyin
2. App Store Connect'te uygulama oluşturun
3. Build hazırlayın ve yükleyin
4. TestFlight ile test edin
5. App Store'a gönderin

