import React, { useState } from "react";
import { logger } from '@/utils/logger';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { turkeyApiService } from "@/services/turkeyApiService";
import { Loader2, Play, Database } from "lucide-react";

const ApiTestPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testApi = async () => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      logger.debug("🚀 API Test başlıyor...");

      // 1. İlleri getir
      logger.debug("1️⃣ İller getiriliyor...");
      const cities = await turkeyApiService.getCitiesForSelect();
      logger.debug("✅ İller alındı:", cities.length, "adet");

      if (cities.length === 0) {
        throw new Error("Hiç il verisi alınamadı!");
      }

      // 2. İstanbul'un ilçelerini getir
      const istanbul = cities.find(city => city.value === "İstanbul");
      if (!istanbul || !istanbul.id) {
        throw new Error("İstanbul bulunamadı!");
      }

      logger.debug("2️⃣ İstanbul ilçeleri getiriliyor...");
      const districts = await turkeyApiService.getDistrictsByCityId(istanbul.id);
      logger.debug("✅ İstanbul ilçeleri alındı:", districts.length, "adet");

      if (districts.length === 0) {
        throw new Error("İstanbul için ilçe verisi alınamadı!");
      }

      // 3. Kadıköy mahallelerini getir
      const kadikoy = districts.find(district => district.value === "Kadıköy");
      if (!kadikoy || !kadikoy.id) {
        throw new Error("Kadıköy bulunamadı!");
      }

      logger.debug("3️⃣ Kadıköy mahalleleri getiriliyor...");
      const neighborhoods = await turkeyApiService.getNeighborhoodsByDistrictIdForSelect(kadikoy.id);
      logger.debug("✅ Kadıköy mahalleleri alındı:", neighborhoods.length, "adet");

      setResults({
        cities: cities.slice(0, 5), // İlk 5 ili göster
        istanbul,
        districts: districts.slice(0, 10), // İlk 10 ilçeyi göster
        kadikoy,
        neighborhoods: neighborhoods.slice(0, 10), // İlk 10 mahalleyi göster
        stats: {
          totalCities: cities.length,
          totalDistricts: districts.length,
          totalNeighborhoods: neighborhoods.length
        }
      });

    } catch (err: any) {
      logger.error("❌ API Test hatası:", err);
      setError(err.message || "Bilinmeyen hata");
    } finally {
      setLoading(false);
    }
  };

  const clearCache = () => {
    turkeyApiService.clearCache();
    setResults(null);
    setError(null);
    logger.debug("🧹 Cache temizlendi");
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-green-600" />
            Turkey API Test Sayfası
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Bu sayfa ile https://turkiyeapi.dev API'sinin çalışıp çalışmadığını test edebilirsiniz.
          </p>

          <div className="flex gap-2 mb-6">
            <Button
              onClick={testApi}
              disabled={loading}
              className="min-w-[120px]"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Test Ediliyor...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  API Test Et
                </>
              )}
            </Button>
            <Button onClick={clearCache} variant="outline" size="default">
              Cache Temizle
            </Button>
          </div>

          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-red-800">❌ Hata</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-red-700">{error}</p>
              </CardContent>
            </Card>
          )}

          {results && (
            <div className="space-y-4">
              {/* İstatistikler */}
              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="text-green-800">📊 Test Sonuçları</CardTitle>
                </CardHeader>
                <CardContent className="text-green-700">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold">{results.stats.totalCities}</div>
                      <div className="text-sm">İl</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{results.stats.totalDistricts}</div>
                      <div className="text-sm">İstanbul İlçesi</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{results.stats.totalNeighborhoods}</div>
                      <div className="text-sm">Kadıköy Mahallesi</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Örnek Veriler */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* İller */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">İlk 5 İl</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      {results.cities.map((city: any, index: number) => (
                        <div key={index} className="flex justify-between">
                          <span>{city.label}</span>
                          <span className="text-muted-foreground">ID: {city.id}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* İlçeler */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">İstanbul İlk 10 İlçe</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      {results.districts.map((district: any, index: number) => (
                        <div key={index} className="flex justify-between">
                          <span>{district.label}</span>
                          <span className="text-muted-foreground">ID: {district.id}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Mahalleler */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Kadıköy İlk 10 Mahalle</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      {results.neighborhoods.map((neighborhood: any, index: number) => (
                        <div key={index}>
                          <div className="flex justify-between">
                            <span>{neighborhood.label}</span>
                            <span className="text-muted-foreground">ID: {neighborhood.id}</span>
                          </div>
                          {neighborhood.postalCode && (
                            <div className="text-xs text-muted-foreground ml-2">
                              Posta Kodu: {neighborhood.postalCode}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Ham Veri */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Ham API Yanıtı (JSON)</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-96">
                    {JSON.stringify(results, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Adımları */}
      <Card className="bg-blue-50/50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-lg text-blue-800">Test Adımları</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-700">
          <ol className="list-decimal list-inside space-y-2">
            <li><strong>İl Listesi:</strong> https://turkiyeapi.dev/api/v1/provinces</li>
            <li><strong>İlçe Listesi:</strong> https://turkiyeapi.dev/api/v1/districts/[city_id]</li>
            <li><strong>Mahalle Listesi:</strong> https://turkiyeapi.dev/api/v1/neighborhoods/[district_id]</li>
            <li><strong>Cache Kontrolü:</strong> Aynı API çağrıları cache'den gelir</li>
          </ol>

          <div className="mt-4 p-3 bg-white rounded border">
            <h4 className="font-semibold text-blue-800 mb-2">Beklenen Sonuçlar:</h4>
            <ul className="text-xs space-y-1">
              <li>✅ 81 il listesi</li>
              <li>✅ İstanbul için ~39 ilçe</li>
              <li>✅ Kadıköy için ~20+ mahalle</li>
              <li>✅ Her mahalle için posta kodu</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ApiTestPage;