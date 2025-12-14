import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { convertImageToJpg } from '@/utils/imageConverter';

interface ConversionLog {
  type: 'info' | 'success' | 'error';
  message: string;
  timestamp: Date;
}

export default function ConvertImages() {
  const [isConverting, setIsConverting] = useState(false);
  const [logs, setLogs] = useState<ConversionLog[]>([]);
  const [stats, setStats] = useState({ total: 0, success: 0, error: 0 });

  const addLog = (type: 'info' | 'success' | 'error', message: string) => {
    setLogs(prev => [...prev, { type, message, timestamp: new Date() }]);
  };

  const convertAllWebpToJpg = async () => {
    setIsConverting(true);
    setLogs([]);
    setStats({ total: 0, success: 0, error: 0 });
    
    addLog('info', '🚀 WebP -> JPG dönüşümü başlatılıyor...');
    
    try {
      // 1. Tüm WebP görselli ürünleri çek
      const { data: products, error: fetchError } = await supabase
        .from('products')
        .select('id, name, image_url')
        .not('image_url', 'is', null)
        .like('image_url', '%.webp');
      
      if (fetchError) {
        addLog('error', `❌ Ürünler çekilirken hata: ${fetchError.message}`);
        return;
      }
      
      if (!products || products.length === 0) {
        addLog('success', '✅ WebP görselli ürün bulunamadı. Tümü zaten JPG formatında!');
        return;
      }
      
      addLog('info', `📊 ${products.length} adet WebP görselli ürün bulundu`);
      setStats(prev => ({ ...prev, total: products.length }));
      
      let successCount = 0;
      let errorCount = 0;
      
      // 2. Her ürünü işle
      for (let i = 0; i < products.length; i++) {
        const product = products[i];
        addLog('info', `[${i + 1}/${products.length}] İşleniyor: ${product.name}`);
        
        try {
          if (!product.image_url) continue;
          
          // Görseli fetch et
          addLog('info', `  📥 Görsel indiriliyor...`);
          const response = await fetch(product.image_url);
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          const blob = await response.blob();
          const file = new File([blob], 'image.webp', { type: 'image/webp' });
          
          // JPG'ye çevir
          addLog('info', `  🔄 JPG'ye çevriliyor...`);
          const jpgFile = await convertImageToJpg(file);
          
          // Yeni dosya adı oluştur
          const newFilePath = `products/${Date.now()}.jpg`;
          
          // Storage'a yükle
          addLog('info', `  📤 Yükleniyor...`);
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
          addLog('info', `  💾 Veritabanı güncelleniyor...`);
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
            addLog('info', `  🗑️  Eski dosya siliniyor...`);
            await supabase.storage
              .from('products')
              .remove([`products/${oldPath}`]);
          }
          
          successCount++;
          setStats(prev => ({ ...prev, success: successCount }));
          addLog('success', `  ✅ Başarılı!`);
          
        } catch (error) {
          errorCount++;
          setStats(prev => ({ ...prev, error: errorCount }));
          addLog('error', `  ❌ Hata: ${(error as Error).message}`);
        }
        
        // Rate limiting için bekle (500ms)
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      addLog('success', `🎉 Dönüşüm tamamlandı! ✅ Başarılı: ${successCount}, ❌ Hatalı: ${errorCount}`);
      
    } catch (error) {
      addLog('error', `❌ Script hatası: ${(error as Error).message}`);
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>WebP Görselleri JPG'ye Çevir</CardTitle>
          <CardDescription>
            Tüm WebP formatındaki ürün görsellerini JPG formatına çevirir. 
            Bu işlem PDF uyumluluğunu garanti eder (@react-pdf/renderer WebP desteklemiyor).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Button 
              onClick={convertAllWebpToJpg} 
              disabled={isConverting}
              size="lg"
            >
              {isConverting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isConverting ? 'Dönüştürülüyor...' : 'Dönüşümü Başlat'}
            </Button>
            
            {stats.total > 0 && (
              <div className="flex gap-4 text-sm">
                <span className="text-muted-foreground">
                  Toplam: {stats.total}
                </span>
                <span className="text-green-600">
                  ✓ {stats.success}
                </span>
                <span className="text-red-600">
                  ✗ {stats.error}
                </span>
              </div>
            )}
          </div>
          
          {logs.length > 0 && (
            <Card className="bg-muted/50">
              <CardContent className="p-4 max-h-96 overflow-y-auto">
                <div className="space-y-1 font-mono text-xs">
                  {logs.map((log, i) => (
                    <div 
                      key={i} 
                      className={`flex items-start gap-2 ${
                        log.type === 'error' ? 'text-red-600' : 
                        log.type === 'success' ? 'text-green-600' : 
                        'text-muted-foreground'
                      }`}
                    >
                      {log.type === 'error' && <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />}
                      {log.type === 'success' && <CheckCircle2 className="h-3 w-3 mt-0.5 flex-shrink-0" />}
                      <span className="flex-1 whitespace-pre-wrap">{log.message}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
