# iOS Build Bilgileri

## 📦 Son Build

**Tarih:** 15 Ocak 2025, 21:40

**IPA Dosyası:**
- **Konum:** `/Users/emreaydin/pafta/apps/mobile/build/ios/ipa/Pafta.App.ipa`
- **Boyut:** 29 MB (31.9 MB toplam)
- **Version:** 1.0.4 ⬆️ (1.0.3 kapatıldığı için yükseltildi)
- **Build Number:** 2 ⬆️
- **Bundle ID:** com.pafta.mobile

**Not:** 1.0.3 versiyonu App Store Connect'te kapatıldığı için version 1.0.4'e yükseltildi.

## 📤 Transporter ile Yükleme

### Adımlar:

1. **Apple Transporter uygulamasını açın**
   - Mac App Store'dan indirin: https://apps.apple.com/us/app/transporter/id1450874784

2. **IPA dosyasını sürükleyip bırakın**
   - Dosya: `/Users/emreaydin/pafta/apps/mobile/build/ios/ipa/Pafta.App.ipa`
   - Transporter penceresine sürükleyip bırakın

3. **Apple ID ile giriş yapın**
   - App Store Connect hesabınızla giriş yapın

4. **Yüklemeyi başlatın**
   - "Deliver" butonuna tıklayın
   - Yükleme tamamlanana kadar bekleyin

## ✅ Bu Build'de Olan Değişiklikler

### Push Notification İyileştirmeleri:
- ✅ APNs token bekleme süresi: 20 saniye (App Store build için)
- ✅ APNs token kontrolü eklendi
- ✅ Detaylı loglar eklendi (AppDelegate.swift)
- ✅ FCM token kaydetme sırasında APNs token kontrolü
- ✅ Hata durumlarında daha açıklayıcı mesajlar

### Dosyalar:
- `lib/services/firebase_messaging_service.dart` - APNs token bekleme ve kontrol
- `ios/Runner/AppDelegate.swift` - Detaylı APNs token logları

## 📝 Notlar

- ⚠️ **TestFlight'ta test etmeden production'a yüklemeyin**
- ✅ **Build number her yüklemede artmalı** (şu an: 2)
- ✅ **Version number sadece önemli değişikliklerde artırılmalı** (şu an: 1.0.4)
- ✅ **IPA dosyası 29 MB** - Normal boyut

## 🔍 Sonraki Adımlar

1. **TestFlight'a yükleyin** (önerilen)
   - Transporter ile yükleyin
   - App Store Connect → TestFlight
   - Test kullanıcıları ekleyin
   - Test edin

2. **Production'a yükleyin** (test başarılıysa)
   - App Store Connect → App Store
   - "+ Version" butonuna tıklayın
   - Build seçin
   - "Submit for Review" butonuna tıklayın

## 📞 Sorun Giderme

### Transporter Hatası:
- Apple ID ile giriş yaptığınızdan emin olun
- İnternet bağlantınızı kontrol edin
- IPA dosyasının tam yolunu kontrol edin

### Build Hatası:
- Flutter clean yapın: `flutter clean`
- Pod install yapın: `cd ios && pod install`
- Xcode'da projeyi temizleyin: Product > Clean Build Folder
