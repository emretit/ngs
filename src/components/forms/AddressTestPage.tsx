import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddressSelectorTR, AddressData } from "./AddressSelectorTR";
import { MapPin, TestTube } from "lucide-react";

interface TestFormData {
  country: string;
  city: string;
  cityId: number;
  district: string;
  districtId: number;
  neighborhood: string;
  neighborhoodId: number;
  addressDetail: string;
  postalCode: string;
}

const AddressTestPage: React.FC = () => {
  const [addressData, setAddressData] = useState<AddressData | null>(null);
  const [testResults, setTestResults] = useState<string[]>([]);

  const form = useForm<TestFormData>({
    defaultValues: {
      country: "Türkiye",
      city: "",
      cityId: 0,
      district: "",
      districtId: 0,
      neighborhood: "",
      neighborhoodId: 0,
      addressDetail: "",
      postalCode: ""
    }
  });

  const handleAddressChange = (address: AddressData) => {
    setAddressData(address);

    // Test sonuçlarını güncelleyalım
    const results = [];

    if (address.country) {
      results.push(`✅ Ülke seçildi: ${address.country}`);
    }

    if (address.city && address.cityId) {
      results.push(`✅ İl seçildi: ${address.city} (ID: ${address.cityId})`);
    }

    if (address.district && address.districtId) {
      results.push(`✅ İlçe seçildi: ${address.district} (ID: ${address.districtId})`);
    }

    if (address.neighborhood) {
      results.push(`✅ Mahalle seçildi: ${address.neighborhood}`);
      if (address.neighborhoodId) {
        results.push(`   └─ Mahalle ID: ${address.neighborhoodId}`);
      }
    }

    if (address.postalCode) {
      results.push(`✅ Posta kodu otomatik dolduruldu: ${address.postalCode}`);
    }

    if (address.addressDetail) {
      results.push(`✅ Adres detayı girildi: ${address.addressDetail}`);
    }

    setTestResults(results);
  };

  const runTestSequence = async () => {
    setTestResults(["🧪 Test başlatılıyor..."]);

    // Test 1: İstanbul seçelim
    await new Promise(resolve => setTimeout(resolve, 500));
    setTestResults(prev => [...prev, "1️⃣ İstanbul seçiliyor..."]);

    // Test için manuel olarak form değerlerini güncelleyelim
    form.setValue("country", "Türkiye");
    await new Promise(resolve => setTimeout(resolve, 500));

    setTestResults(prev => [...prev, "2️⃣ Test tamamlandı. Manuel olarak adres seçin:"]);
    setTestResults(prev => [...prev, "   - İl: İstanbul"]);
    setTestResults(prev => [...prev, "   - İlçe: Kadıköy"]);
    setTestResults(prev => [...prev, "   - Mahalle: Moda"]);
  };

  const clearTest = () => {
    form.reset();
    setAddressData(null);
    setTestResults([]);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5 text-blue-600" />
            Türkiye Adres Seçici Test Sayfası
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Bu sayfa ile adres seçici komponentini test edebilirsiniz.
            Sırayla İl → İlçe → Mahalle seçin ve sonuçları gözlemleyin.
          </p>

          <div className="flex gap-2 mb-6">
            <Button onClick={runTestSequence} variant="outline" size="sm">
              Test Başlat
            </Button>
            <Button onClick={clearTest} variant="outline" size="sm">
              Temizle
            </Button>
          </div>

          <Form {...form}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Sol taraf: Adres Seçici */}
              <div>
                <AddressSelectorTR
                  control={form.control}
                  onChange={handleAddressChange}
                  required={true}
                  showCard={true}
                />
              </div>

              {/* Sağ taraf: Test Sonuçları */}
              <div>
                <Card className="h-fit">
                  <CardHeader>
                    <CardTitle className="text-lg">Test Sonuçları</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {testResults.length > 0 ? (
                      <div className="space-y-1 text-sm font-mono">
                        {testResults.map((result, index) => (
                          <div key={index} className="text-green-700">
                            {result}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Henüz adres seçimi yapılmadı. Yukarıdan başlayın.
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Canlı Adres Verisi */}
                {addressData && (
                  <Card className="mt-4">
                    <CardHeader>
                      <CardTitle className="text-lg">Canlı Adres Verisi</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto">
                        {JSON.stringify(addressData, null, 2)}
                      </pre>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </Form>
        </CardContent>
      </Card>

      {/* Test Talimatları */}
      <Card className="bg-blue-50/50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-lg text-blue-800">Test Talimatları</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-700">
          <ol className="list-decimal list-inside space-y-2">
            <li><strong>İl Seçimi:</strong> "Türkiye" seçili iken bir il seçin (örn: İstanbul)</li>
            <li><strong>İlçe Seçimi:</strong> İl seçildikten sonra ilçe listesi yüklenecek (örn: Kadıköy)</li>
            <li><strong>Mahalle Seçimi:</strong> İlçe seçildikten sonra mahalle listesi yüklenecek (örn: Moda)</li>
            <li><strong>Otomatik Posta Kodu:</strong> Mahalle seçildiğinde posta kodu otomatik doldurulacak</li>
            <li><strong>Adres Özeti:</strong> Tam seçim sonrası adres özeti görünecek</li>
          </ol>

          <div className="mt-4 p-3 bg-white rounded border">
            <h4 className="font-semibold text-blue-800 mb-2">Önerilen Test Senaryoları:</h4>
            <ul className="text-xs space-y-1">
              <li>🏙️ <strong>İstanbul → Kadıköy → Moda</strong></li>
              <li>🏛️ <strong>Ankara → Çankaya → Kızılay</strong></li>
              <li>🌊 <strong>İzmir → Konak → Alsancak</strong></li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddressTestPage;