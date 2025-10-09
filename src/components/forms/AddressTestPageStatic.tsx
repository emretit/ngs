import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddressSelectorTR, AddressData } from "./AddressSelectorTR";
import { MapPin, TestTube, CheckCircle } from "lucide-react";

interface TestFormData {
  country: string;
  city: string;
  district: string;
  neighborhood: string;
  addressDetail: string;
  postalCode: string;
}

const AddressTestPageStatic: React.FC = () => {
  const [addressData, setAddressData] = useState<AddressData | null>(null);
  const [testResults, setTestResults] = useState<string[]>([]);

  const form = useForm<TestFormData>({
    defaultValues: {
      country: "Türkiye",
      city: "",
      district: "",
      neighborhood: "",
      addressDetail: "",
      postalCode: ""
    }
  });

  const handleAddressChange = (address: AddressData) => {
    setAddressData(address);

    // Test sonuçlarını güncelleyelim
    const results = [];

    if (address.country) {
      results.push(`✅ Ülke seçildi: ${address.country}`);
    }

    if (address.city) {
      results.push(`✅ İl seçildi: ${address.city}`);
    }

    if (address.district) {
      results.push(`✅ İlçe seçildi: ${address.district}`);
    }

    if (address.neighborhood) {
      results.push(`✅ Mahalle seçildi: ${address.neighborhood}`);
    }

    if (address.postalCode) {
      results.push(`✅ Posta kodu otomatik dolduruldu: ${address.postalCode}`);
    }

    if (address.addressDetail) {
      results.push(`✅ Adres detayı girildi: ${address.addressDetail}`);
    }

    setTestResults(results);
  };

  const runTestSequence = () => {
    setTestResults(["🧪 Test önerileri:"]);
    setTestResults(prev => [...prev, "1️⃣ Türkiye'yi seçin"]);
    setTestResults(prev => [...prev, "2️⃣ İstanbul'u seçin"]);
    setTestResults(prev => [...prev, "3️⃣ Kadıköy'ü seçin"]);
    setTestResults(prev => [...prev, "4️⃣ Bir mahalle seçin (örn: Moda)"]);
    setTestResults(prev => [...prev, "5️⃣ Adres detayını girin"]);
  };

  const loadExampleData = () => {
    form.setValue("country", "Türkiye");
    form.setValue("city", "İstanbul");
    form.setValue("district", "Kadıköy");
    form.setValue("neighborhood", "Moda");
    form.setValue("addressDetail", "Örnek Caddesi No: 123 Kat: 4 Daire: 8");
  };

  const clearTest = () => {
    form.reset();
    setAddressData(null);
    setTestResults([]);
  };

  const isComplete = addressData &&
    addressData.country &&
    addressData.city &&
    addressData.district &&
    addressData.neighborhood;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5 text-blue-600" />
            Statik Veri ile Türkiye Adres Seçici Testi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Bu sayfa statik veri kullanarak adres seçici komponentini test eder.
            API çağrısı yapmaz, tüm veriler kod içinde bulunur.
          </p>

          <div className="flex gap-2 mb-6">
            <Button onClick={runTestSequence} variant="outline" size="sm">
              Test Talimatları
            </Button>
            <Button onClick={loadExampleData} variant="outline" size="sm">
              Örnek Veri Yükle
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
              <div className="space-y-4">
                {/* Test Durumu */}
                <Card className={isComplete ? "border-green-500 bg-green-50" : ""}>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {isComplete ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <TestTube className="h-5 w-5 text-blue-600" />
                      )}
                      Test Durumu
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isComplete ? (
                      <div className="text-green-700 font-semibold">
                        ✅ Adres seçimi tamamlandı!
                      </div>
                    ) : (
                      <div className="text-blue-700">
                        🔄 Lütfen adres seçimini tamamlayın
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Test Sonuçları */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Test Sonuçları</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {testResults.length > 0 ? (
                      <div className="space-y-1 text-sm">
                        {testResults.map((result, index) => (
                          <div key={index} className="text-gray-700">
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
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Canlı Adres Verisi</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 gap-2 text-sm">
                        <div><strong>Ülke:</strong> {addressData.country || "-"}</div>
                        <div><strong>İl:</strong> {addressData.city || "-"}</div>
                        <div><strong>İlçe:</strong> {addressData.district || "-"}</div>
                        <div><strong>Mahalle:</strong> {addressData.neighborhood || "-"}</div>
                        <div><strong>Posta Kodu:</strong> {addressData.postalCode || "-"}</div>
                        <div><strong>Adres Detayı:</strong> {addressData.addressDetail || "-"}</div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </Form>
        </CardContent>
      </Card>

      {/* Mevcut Veri Durumu */}
      <Card className="bg-yellow-50/50 border-yellow-200">
        <CardHeader>
          <CardTitle className="text-lg text-yellow-800">📊 Mevcut Statik Veri Durumu</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-yellow-700">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">81</div>
              <div>İl</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">~40</div>
              <div>İstanbul İlçesi</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">~20</div>
              <div>Kadıköy Mahallesi</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">~500</div>
              <div>Toplam Mahalle</div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-white rounded border">
            <h4 className="font-semibold text-yellow-800 mb-2">Test Edilebilir Şehirler:</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 text-xs space-y-1">
              <div>✅ İstanbul (39 ilçe)</div>
              <div>✅ Ankara (25 ilçe)</div>
              <div>✅ İzmir (30 ilçe)</div>
              <div>✅ Bursa (17 ilçe)</div>
              <div>✅ Antalya (19 ilçe)</div>
              <div>✅ Adana (15 ilçe)</div>
            </div>
          </div>

          <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-2">⚠️ Önemli Notlar:</h4>
            <ul className="text-xs space-y-1 text-blue-700">
              <li>• Bu test statik veri kullanır, API çağrısı yapmaz</li>
              <li>• Mahalle verisi sadece major şehirler için mevcuttur</li>
              <li>• Posta kodları mevcut mahalleler için otomatik doldurulur</li>
              <li>• Veri yapısı /src/data/turkeyAddressData.ts dosyasındadır</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddressTestPageStatic;