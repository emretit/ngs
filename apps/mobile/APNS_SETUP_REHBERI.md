# APNs Authentication Key Kurulum Rehberi

## 1. Apple Developer Console'dan APNs Key Oluşturma

### Adımlar:
1. **Apple Developer Console'a giriş yapın:**
   - https://developer.apple.com/account/ adresine gidin
   - Apple Developer hesabınızla giriş yapın

2. **Certificates, Identifiers & Profiles sayfasına gidin:**
   - Sol menüden "Certificates, Identifiers & Profiles" seçin
   - Veya direkt: https://developer.apple.com/account/resources/authkeys/list

3. **Keys bölümüne gidin:**
   - Sol menüden "Keys" seçin
   - Sağ üstteki "+" (Create a key) butonuna tıklayın

4. **Yeni Key oluşturun:**
   - **Key Name:** "Pafta FCM Push Notifications" (veya istediğiniz bir isim)
   - **Enable Apple Push Notifications service (APNs)** seçeneğini işaretleyin
   - "Continue" butonuna tıklayın
   - "Register" butonuna tıklayın

5. **Key'i indirin:**
   - ⚠️ **ÖNEMLİ:** Key'i hemen indirin! İndirmezseniz bir daha indiremezsiniz
   - "Download" butonuna tıklayın
   - `.p8` uzantılı dosya indirilecek (örn: `AuthKey_XXXXXXXXXX.p8`)
   - **Key ID**'yi not edin (örn: `XXXXXXXXXX`)

6. **Team ID'yi bulun:**
   - Apple Developer Console'da sağ üstte Team ID görünür
   - Veya: https://developer.apple.com/account/ adresinde "Membership" bölümünde görünür

## 2. Firebase Console'a APNs Key Yükleme

### Adımlar:
1. **Firebase Console'a gidin:**
   - https://console.firebase.google.com/ adresine gidin
   - Projenizi seçin (pafta-b84ce)

2. **Project Settings'e gidin:**
   - Sol üstteki ⚙️ (Settings) ikonuna tıklayın
   - "Project settings" seçin

3. **Cloud Messaging sekmesine gidin:**
   - Üstteki "Cloud Messaging" sekmesine tıklayın
   - "Apple app configuration" bölümünde "Pafta.APP" (com.pafta.mobile) seçin

4. **APNs Authentication Key yükleyin:**
   - "APNs Authentication Key" bölümünde "Upload" butonuna tıklayın
   - **Key ID:** Apple Developer'dan aldığınız Key ID'yi girin
   - **Team ID:** Apple Developer'dan aldığınız Team ID'yi girin
   - **Key (.p8 file):** İndirdiğiniz `.p8` dosyasını seçin
   - "Upload" butonuna tıklayın

5. **Production Key yükleyin:**
   - Aynı key'i hem Development hem Production için kullanabilirsiniz
   - Production için de aynı key'i yükleyin

## 3. Uygulamayı Yeniden Build Etme

### Adımlar:
1. **Xcode'da projeyi açın:**
   ```bash
   cd ios
   open Runner.xcworkspace
   ```

2. **Bundle ID kontrolü:**
   - Target → Runner → General
   - Bundle Identifier: `com.pafta.mobile` olduğundan emin olun

3. **GoogleService-Info.plist kontrolü:**
   - `ios/Runner/GoogleService-Info.plist` dosyasının güncel olduğundan emin olun
   - Firebase Console'dan yeni campaign için indirdiğiniz dosyayı kullanın

4. **Clean Build:**
   - Xcode'da: Product → Clean Build Folder (Shift+Cmd+K)

5. **Uygulamayı build edin:**
   - Xcode'da: Product → Run (Cmd+R)
   - Veya Flutter ile: `flutter run`

## 4. Test Etme

### Adımlar:
1. **Uygulamayı açın:**
   - Uygulama açıldığında yeni FCM token otomatik oluşturulacak
   - Token'ın veritabanına kaydedildiğini kontrol edin

2. **Servis ataması yapın:**
   - Bir servis talebini Emre Aydın'a atayın
   - Bildirim gönderimini kontrol edin

## Önemli Notlar:

- ⚠️ **Key dosyasını güvenli bir yerde saklayın!** Bir daha indiremezsiniz
- ⚠️ **Key ID ve Team ID'yi not edin!** Firebase'e yüklerken gerekecek
- ✅ Aynı key'i hem Development hem Production için kullanabilirsiniz
- ✅ Key yüklendikten sonra uygulamayı yeniden build etmeniz gerekir
