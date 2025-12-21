#!/bin/bash

# iOS Release Build Script
# Bu script iOS için release build oluşturur ve App Store'a yüklemeye hazır hale getirir

set -e  # Hata durumunda dur

echo "🚀 iOS Release Build başlatılıyor..."

# Proje dizinine git
cd "$(dirname "$0")/.."

# Flutter clean
echo "📦 Flutter clean yapılıyor..."
flutter clean

# Dependencies yükle
echo "📥 Dependencies yükleniyor..."
flutter pub get

# iOS pods yükle
echo "🍎 iOS Pods yükleniyor..."
cd ios
pod install
cd ..

# Build number kontrolü
VERSION=$(grep '^version:' pubspec.yaml | sed 's/version: //')
BUILD_NUMBER=$(echo $VERSION | cut -d'+' -f2)
VERSION_NAME=$(echo $VERSION | cut -d'+' -f1)

echo "📱 Version: $VERSION_NAME"
echo "🔢 Build Number: $BUILD_NUMBER"

# Release build oluştur
echo "🏗️  Release build oluşturuluyor..."
flutter build ipa --release

# Build sonucu kontrolü
if [ -f "build/ios/ipa/pafta_mobile.ipa" ]; then
    echo "✅ Build başarılı!"
    echo "📦 IPA dosyası: build/ios/ipa/pafta_mobile.ipa"
    echo ""
    echo "📤 Sonraki adımlar:"
    echo "1. Xcode'da Archive oluştur: Product > Archive"
    echo "2. Organizer'da 'Distribute App' butonuna tıkla"
    echo "3. 'App Store Connect' seç"
    echo "4. 'Upload' seç ve yükle"
    echo ""
    echo "VEYA"
    echo ""
    echo "fastlane ile yükle: fastlane ios beta"
else
    echo "❌ Build başarısız!"
    exit 1
fi
