import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { loadTurkeyAddressData, checkTurkeyAddressData } from '@/scripts/loadTurkeyAddressData';
import { Loader2, Download, Check, AlertCircle, Database } from 'lucide-react';

const LoadAddressData = () => {
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [status, setStatus] = useState<any>(null);
  const [loadResult, setLoadResult] = useState<any>(null);
  const { toast } = useToast();

  const handleCheckData = async () => {
    setChecking(true);
    try {
      const result = await checkTurkeyAddressData();
      setStatus(result);
      
      if (result.hasData) {
        toast({
          title: "Veri Bulundu",
          description: `${result.counts.cities} il, ${result.counts.districts} ilçe, ${result.counts.neighborhoods} mahalle mevcut.`,
        });
      } else {
        toast({
          title: "Veri Yok",
          description: "Veritabanında adres verisi bulunamadı. Yükleme yapmanız gerekiyor.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Hata",
        description: "Veri kontrolü sırasında bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setChecking(false);
    }
  };

  const handleLoadData = async () => {
    setLoading(true);
    setLoadResult(null);
    
    try {
      toast({
        title: "Yükleme Başladı",
        description: "Türkiye adres verileri yükleniyor... Bu işlem birkaç dakika sürebilir.",
      });

      const result = await loadTurkeyAddressData();
      setLoadResult(result);
      
      if (result.errors.length === 0) {
        toast({
          title: "Başarılı!",
          description: `${result.citiesLoaded} il, ${result.districtsLoaded} ilçe, ${result.neighborhoodsLoaded} mahalle yüklendi.`,
        });
      } else {
        toast({
          title: "Kısmi Başarı",
          description: `Bazı veriler yüklenirken hata oluştu. ${result.errors.length} hata.`,
          variant: "destructive",
        });
      }

      // Refresh status after loading
      await handleCheckData();
    } catch (error) {
      toast({
        title: "Hata",
        description: "Veri yükleme sırasında bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Türkiye Adres Verileri</h1>
          <p className="text-muted-foreground">
            Çalışan ekleme formunda kullanılmak üzere tüm Türkiye adres verilerini yükleyin.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Veri Durumu
            </CardTitle>
            <CardDescription>
              Veritabanındaki mevcut adres verilerinin durumu
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handleCheckData} 
              disabled={checking}
              variant="outline"
              className="w-full"
            >
              {checking ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Kontrol Ediliyor...
                </>
              ) : (
                <>
                  <Database className="mr-2 h-4 w-4" />
                  Veri Durumunu Kontrol Et
                </>
              )}
            </Button>

            {status && (
              <Alert className={status.hasData ? "border-green-500" : "border-yellow-500"}>
                {status.hasData ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                )}
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-semibold">
                      {status.hasData ? "Veriler Mevcut" : "Veri Yükleme Gerekli"}
                    </p>
                    <div className="text-sm space-y-1">
                      <p>İller: {status.counts.cities} / 81</p>
                      <p>İlçeler: {status.counts.districts} / 973</p>
                      <p>Mahalleler: {status.counts.neighborhoods} / ~32,000</p>
                      {status.counts.lastSync && (
                        <p className="text-muted-foreground mt-2">
                          Son Güncelleme: {new Date(status.counts.lastSync).toLocaleString('tr-TR')}
                        </p>
                      )}
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Veri Yükleme
            </CardTitle>
            <CardDescription>
              turkiyeapi.dev API'sinden tüm Türkiye adres verilerini yükleyin
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <p className="font-semibold mb-2">Dikkat:</p>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  <li>Bu işlem 81 il, 973 ilçe ve 32,000+ mahalle verisini yükleyecektir</li>
                  <li>İşlem 5-10 dakika sürebilir</li>
                  <li>Mevcut veriler silinip yeniden yüklenecektir</li>
                  <li>İşlem sırasında sayfayı kapatmayın</li>
                </ul>
              </AlertDescription>
            </Alert>

            <Button 
              onClick={handleLoadData} 
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Veriler Yükleniyor...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Tüm Verileri Yükle
                </>
              )}
            </Button>

            {loading && (
              <div className="space-y-2">
                <Progress value={undefined} className="w-full" />
                <p className="text-sm text-muted-foreground text-center">
                  Lütfen bekleyin, veriler yükleniyor...
                </p>
              </div>
            )}

            {loadResult && (
              <Alert className={loadResult.errors.length === 0 ? "border-green-500" : "border-yellow-500"}>
                {loadResult.errors.length === 0 ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                )}
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-semibold">Yükleme Tamamlandı</p>
                    <div className="text-sm space-y-1">
                      <p>✅ İller: {loadResult.citiesLoaded}</p>
                      <p>✅ İlçeler: {loadResult.districtsLoaded}</p>
                      <p>✅ Mahalleler: {loadResult.neighborhoodsLoaded}</p>
                      {loadResult.errors.length > 0 && (
                        <p className="text-yellow-600">
                          ⚠️ {loadResult.errors.length} hata ile karşılaşıldı
                        </p>
                      )}
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kullanım</CardTitle>
            <CardDescription>
              Veriler yüklendikten sonra nasıl kullanılacağı
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-2">
              <p>✅ Veriler yüklendikten sonra:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Çalışan ekleme formunda il, ilçe ve mahalle seçimi yapabilirsiniz</li>
                <li>Müşteri ekleme formunda adres bilgileri girebilirsiniz</li>
                <li>Tüm adres seçim bileşenleri bu verileri kullanacaktır</li>
              </ul>
              <p className="mt-4">ℹ️ Veriler bir kez yüklendikten sonra tekrar yüklemenize gerek yoktur.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoadAddressData;
