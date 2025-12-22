import sharp from 'sharp';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function convertSvgToPng() {
  try {
    const svgPath = join(__dirname, '../public/logo-large.svg');
    const outputPath = join(__dirname, '../public/og-image.png');
    
    console.log('📖 SVG dosyası okunuyor...');
    const svgBuffer = readFileSync(svgPath);
    
    console.log('🔄 PNG\'ye dönüştürülüyor (1200x630)...');
    
    // SVG'yi 1200x630 boyutunda PNG'ye dönüştür
    // WhatsApp ve sosyal medya için önerilen boyut
    await sharp(svgBuffer)
      .resize(1200, 630, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 } // Beyaz arka plan
      })
      .png()
      .toFile(outputPath);
    
    console.log('✅ PNG dosyası oluşturuldu: public/og-image.png');
    console.log('📐 Boyut: 1200x630 piksel');
  } catch (error) {
    console.error('❌ Hata:', error);
    process.exit(1);
  }
}

convertSvgToPng();

