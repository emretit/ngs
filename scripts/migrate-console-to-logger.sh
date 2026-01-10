#!/bin/bash

# Console to Logger Migration Script
# Bu script console.log/warn/error/debug'ı logger'a migrate eder

echo "🔄 Console to Logger Migration Script"
echo "======================================"
echo ""

# Renk kodları
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# İstatistikler
TOTAL_FILES=0
MODIFIED_FILES=0
TOTAL_REPLACEMENTS=0

# Yedek dizini oluştur
BACKUP_DIR=".console-migration-backup-$(date +%Y%m%d-%H%M%S)"
echo "📦 Yedek dizini oluşturuluyor: $BACKUP_DIR"
mkdir -p "$BACKUP_DIR"

# Sadece src/ altındaki .ts ve .tsx dosyalarını işle
echo ""
echo "🔍 Dosyalar taranıyor..."
echo ""

# Geçici dosya
TEMP_FILE=$(mktemp)

# src/ altındaki tüm .ts ve .tsx dosyalarını bul
find src -type f \( -name "*.ts" -o -name "*.tsx" \) | while read -r file; do
  TOTAL_FILES=$((TOTAL_FILES + 1))
  
  # Dosyada console kullanımı var mı kontrol et
  if grep -q "console\.\(log\|warn\|error\|debug\)" "$file"; then
    echo "📝 İşleniyor: $file"
    
    # Yedek al
    cp "$file" "$BACKUP_DIR/"
    
    # logger import kontrolü
    HAS_LOGGER_IMPORT=$(grep -c "from '@/utils/logger'" "$file" || echo "0")
    
    # Eğer logger import yoksa ekle
    if [ "$HAS_LOGGER_IMPORT" -eq "0" ]; then
      # İlk import satırından sonra ekle
      sed -i '' "1 a\\
import { logger } from '@/utils/logger';
" "$file"
    fi
    
    # Console -> Logger dönüşümleri
    # console.log -> logger.debug
    sed -i '' 's/console\.log(/logger.debug(/g' "$file"
    
    # console.warn -> logger.warn
    sed -i '' 's/console\.warn(/logger.warn(/g' "$file"
    
    # console.error -> logger.error
    sed -i '' 's/console\.error(/logger.error(/g' "$file"
    
    # console.debug -> logger.debug
    sed -i '' 's/console\.debug(/logger.debug(/g' "$file"
    
    MODIFIED_FILES=$((MODIFIED_FILES + 1))
    
    # Kaç satır değişti
    CHANGES=$(grep -c "logger\." "$file" || echo "0")
    TOTAL_REPLACEMENTS=$((TOTAL_REPLACEMENTS + CHANGES))
    
    echo "   ✅ Tamamlandı ($CHANGES değişiklik)"
  fi
done

echo ""
echo "======================================"
echo "📊 Özet"
echo "======================================"
echo "${GREEN}✅ İşlenen dosya sayısı: $MODIFIED_FILES${NC}"
echo "${GREEN}✅ Toplam değişiklik: $TOTAL_REPLACEMENTS${NC}"
echo "${YELLOW}📦 Yedek dizini: $BACKUP_DIR${NC}"
echo ""
echo "⚠️  DİKKAT:"
echo "  1. Değişiklikleri kontrol edin"
echo "  2. Build çalıştırın: npm run build"
echo "  3. Testleri çalıştırın: npm test"
echo "  4. Git diff ile değişiklikleri inceleyin"
echo ""
echo "Geri alma için: cp -r $BACKUP_DIR/* src/"
echo ""

# Temizlik
rm -f "$TEMP_FILE"

exit 0
