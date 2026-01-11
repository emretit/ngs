/**
 * Mevcut WebP görsellerini JPG'ye çeviren migration script
 * 
 * Kullanım: Tarayıcı console'da çalıştırın
 */

import { supabase } from '@/integrations/supabase/client';
import { convertImageToJpg } from '@/utils/imageConverter';

interface Product {
  id: string;
  name: string;
  image_url: string | null;
}

export async function convertAllWebpToJpg() {
  console.log('🚀 WebP -> JPG dönüşümü başlatılıyor...');
  
  try {
    // 1. Tüm WebP görselli ürünleri çek
    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('id, name, image_url')
      .not('image_url', 'is', null)
      .like('image_url', '%.webp');
    
    if (fetchError) {
      console.error('❌ Ürünler çekilirken hata:', fetchError);
      return;
    }
    
    if (!products || products.length === 0) {
      console.log('✅ WebP görselli ürün bulunamadı. Tümü zaten JPG formatında!');
      return;
    }
    
    console.log(`📊 ${products.length} adet WebP görselli ürün bulundu`);
    
    let successCount = 0;
    let errorCount = 0;
    
    // 2. Her ürünü işle
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      console.log(`\n[${i + 1}/${products.length}] İşleniyor: ${product.name}`);
      
      try {
        if (!product.image_url) continue;
        
        // Görseli fetch et
        console.log('  📥 Görsel indiriliyor...');
        const response = await fetch(product.image_url);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const blob = await response.blob();
        const file = new File([blob], 'image.webp', { type: 'image/webp' });
        
        // JPG'ye çevir
        console.log('  🔄 JPG\'ye çevriliyor...');
        const jpgFile = await convertImageToJpg(file);
        
        // Yeni dosya adı oluştur
        const newFilePath = `products/${Date.now()}.jpg`;
        
        // Storage'a yükle
        console.log('  📤 Yükleniyor...');
        const { error: uploadError } = await supabase.storage
          .from('products')
          .upload(newFilePath, jpgFile);
        
        if (uploadError) {
          throw uploadError;
        }
        
        // Public URL al
        const { data: urlData } = supabase.storage
          .from('products')
          .getPublicUrl(newFilePath);
        
        if (!urlData?.publicUrl) {
          throw new Error('Public URL alınamadı');
        }
        
        // Ürünü güncelle
        console.log('  💾 Veritabanı güncelleniyor...');
        const { error: updateError } = await supabase
          .from('products')
          .update({ image_url: urlData.publicUrl })
          .eq('id', product.id);
        
        if (updateError) {
          throw updateError;
        }
        
        // Eski WebP dosyasını sil
        const oldPath = product.image_url.split('/products/')[1];
        if (oldPath) {
          console.log('  🗑️  Eski dosya siliniyor...');
          await supabase.storage
            .from('products')
            .remove([`products/${oldPath}`]);
        }
        
        successCount++;
        console.log(`  ✅ Başarılı!`);
        
      } catch (error) {
        errorCount++;
        console.error(`  ❌ Hata:`, error);
      }
      
      // Rate limiting için bekle (1 saniye)
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n' + '='.repeat(50));
    console.log(`🎉 Dönüşüm tamamlandı!`);
    console.log(`✅ Başarılı: ${successCount}`);
    console.log(`❌ Hatalı: ${errorCount}`);
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('❌ Script hatası:', error);
  }
}

// Export to window for console usage
if (typeof window !== 'undefined') {
  (window as any).convertAllWebpToJpg = convertAllWebpToJpg;
}
