#!/bin/bash

# iOS Release Build Script
# Bu script App Store için release build oluşturur

set -e

echo "🚀 iOS Release Build Başlatılıyor..."
echo ""

# Flutter clean
echo "📦 Flutter clean yapılıyor..."
flutter clean

# Dependencies güncelle
echo "📥 Dependencies güncelleniyor..."
flutter pub get

# iOS pods güncelle
echo "🍎 CocoaPods güncelleniyor..."
cd ios
pod install
cd ..

# Release build oluştur
echo "🔨 Release build oluşturuluyor..."
flutter build ipa --release

echo ""
echo "✅ Build tamamlandı!"
echo "📱 IPA dosyası: build/ios/ipa/ klasöründe"
echo ""
echo "Sonraki adımlar:"
echo "1. Xcode'da Archive oluşturun veya"
echo "2. Transporter uygulaması ile IPA'yı yükleyin"
echo "3. App Store Connect'te build'i kontrol edin"

