# PAFTA Teknik Servis Mobile App

Flutter ile geliştirilmiş teknik servis yönetim uygulaması. Teknisyenlerin servis taleplerini yönetmesi ve takip etmesi için tasarlanmıştır.

## 🚀 Özellikler

- **Teknisyen Girişi**: Supabase Auth ile güvenli kimlik doğrulama
- **Servis Talepleri**: Atanan servis taleplerini görüntüleme ve yönetme
- **Durum Güncelleme**: Servis durumunu güncelleme (yeni, atandı, devam ediyor, tamamlandı)
- **Realtime Güncellemeler**: Supabase Realtime ile anlık güncellemeler
- **Profil Yönetimi**: Teknisyen profil bilgilerini görüntüleme ve düzenleme
- **Çevrimdışı Desteği**: Hive ile local storage desteği

## 🛠️ Teknolojiler

- **Flutter**: Cross-platform mobil uygulama geliştirme
- **Supabase**: Backend, veritabanı ve realtime özellikler
- **Riverpod**: State management
- **Hive**: Local storage
- **Flutter SVG**: Logo ve ikon desteği

## 📱 Desteklenen Platformlar

- iOS 13.0+
- Android API 21+

## 🚀 Kurulum

### Gereksinimler
- Flutter SDK 3.0.0+
- Dart 3.0.0+
- iOS 13.0+ (iOS için)
- Android API 21+ (Android için)

### Adımlar

1. **Repository'yi klonlayın**
   ```bash
   git clone <repository-url>
   cd paftamobile
   ```

2. **Bağımlılıkları yükleyin**
   ```bash
   flutter pub get
   ```

3. **iOS için CocoaPods yükleyin**
   ```bash
   cd ios && pod install && cd ..
   ```

4. **Uygulamayı çalıştırın**
   ```bash
   flutter run
   ```

## 🔧 Konfigürasyon

### Supabase Ayarları
`lib/core/constants/app_constants.dart` dosyasında Supabase URL ve API key'lerini ayarlayın:

```dart
class AppConstants {
  static const String supabaseUrl = 'YOUR_SUPABASE_URL';
  static const String supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';
}
```

## 📁 Proje Yapısı

```
lib/
├── core/
│   ├── constants/          # Sabitler
│   ├── services/           # Servisler
│   └── theme/              # Tema ayarları
├── features/
│   ├── auth/               # Kimlik doğrulama
│   ├── home/               # Ana sayfa
│   ├── service_requests/   # Servis talepleri
│   └── profile/            # Profil
├── shared/
│   ├── models/             # Veri modelleri
│   └── widgets/            # Paylaşılan widget'lar
└── main.dart               # Uygulama giriş noktası
```

## 🎨 Tema ve Marka

- **Marka Renkleri**: PAFTA kırmızı (#8B0000)
- **Logo**: PAFTA Teknik Servis logosu
- **Tasarım**: Modern ve kullanıcı dostu arayüz

## 🔐 Güvenlik

- Supabase RLS (Row Level Security) ile veri güvenliği
- JWT token tabanlı kimlik doğrulama
- Güvenli API endpoint'leri

## 📊 Veritabanı

Supabase PostgreSQL veritabanı kullanılmaktadır:

- **service_requests**: Servis talepleri
- **employees**: Teknisyen bilgileri
- **user_tokens**: FCM token'ları (push notification için)
- **companies**: Şirket bilgileri

## 🚀 Deployment

### iOS
1. Xcode'da projeyi açın
2. Signing & Capabilities ayarlarını yapın
3. Archive oluşturun
4. App Store'a yükleyin

### Android
1. `android/app/build.gradle` dosyasında signing config'i ayarlayın
2. APK veya AAB oluşturun
3. Google Play Store'a yükleyin

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'Add some amazing feature'`)
4. Push yapın (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 📞 İletişim

- **Website**: https://pafta.app/
- **Email**: info@pafta.app

---

**PAFTA Teknik Servis** - Mobil uygulama ile teknik servis yönetimini kolaylaştırın! 🔧