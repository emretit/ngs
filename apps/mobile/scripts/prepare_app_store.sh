#!/bin/bash

# App Store Hazırlık Script'i
# Bu script App Store'a yüklemeden önce gerekli kontrolleri yapar

set -e

echo "🔍 App Store hazırlık kontrolleri yapılıyor..."

cd "$(dirname "$0")/.."

# 1. Bundle Identifier kontrolü
BUNDLE_ID=$(grep -A 1 "PRODUCT_BUNDLE_IDENTIFIER" ios/Runner.xcodeproj/project.pbxproj | grep -v "RunnerTests" | head -1 | sed 's/.*= //;s/;//')
echo "📱 Bundle Identifier: $BUNDLE_ID"

if [[ $BUNDLE_ID == *"example"* ]]; then
    echo "❌ HATA: Bundle Identifier 'example' içeriyor. App Store'da kullanılamaz!"
    echo "   Lütfen Bundle Identifier'ı güncelleyin: com.pafta.mobile"
    exit 1
fi

# 2. Version kontrolü
VERSION=$(grep '^version:' pubspec.yaml | sed 's/version: //')
echo "📱 Version: $VERSION"

# 3. Entitlements kontrolü
if grep -q "aps-environment.*development" ios/Runner/Runner.entitlements; then
    echo "⚠️  UYARI: Push notifications development modunda. Production için güncelleyin!"
fi

# 4. Info.plist kontrolü
if ! grep -q "CFBundleDisplayName" ios/Runner/Info.plist; then
    echo "⚠️  UYARI: CFBundleDisplayName eksik olabilir"
fi

# 5. Google Maps API key kontrolü
if [ -f "ios/Runner/AppDelegate.swift" ]; then
    if grep -q "AIza" ios/Runner/AppDelegate.swift; then
        echo "✅ Google Maps API key bulundu"
    else
        echo "⚠️  UYARI: Google Maps API key kontrol edin"
    fi
fi

# 6. Firebase yapılandırması kontrolü
if [ -f "ios/Runner/GoogleService-Info.plist" ]; then
    echo "✅ Firebase yapılandırması bulundu"
else
    echo "⚠️  UYARI: GoogleService-Info.plist bulunamadı"
fi

# 7. Icon kontrolü
if [ -d "ios/Runner/Assets.xcassets/AppIcon.appiconset" ]; then
    ICON_COUNT=$(find ios/Runner/Assets.xcassets/AppIcon.appiconset -name "*.png" | wc -l)
    echo "✅ App Icon bulundu ($ICON_COUNT dosya)"
else
    echo "⚠️  UYARI: App Icon eksik olabilir"
fi

echo ""
echo "✅ Kontroller tamamlandı!"
echo ""
echo "📋 Sonraki adımlar:"
echo "1. Apple Developer Console'da App ID oluştur: $BUNDLE_ID"
echo "2. App Store Connect'te uygulama oluştur"
echo "3. Privacy Policy hazırla ve yayınla"
echo "4. Screenshots hazırla"
echo "5. Build oluştur: ./scripts/build_ios_release.sh"
echo "6. TestFlight'a yükle veya App Store'a gönder"
