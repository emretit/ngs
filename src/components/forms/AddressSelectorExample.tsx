import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AddressSelectorTR, AddressData } from "./AddressSelectorTR";
import { addressService, SavedAddress } from "@/services/addressService";
import { MapPin, Save, Loader2 } from "lucide-react";

interface ExampleFormData {
  // Address fields
  country: string;
  city: string;
  district: string;
  neighborhood: string;
  addressDetail: string;
  postalCode: string;

  // Entity info
  entityId: string;
  entityType: string;
  name: string;
}

const AddressSelectorExample: React.FC = () => {
  const [addressData, setAddressData] = useState<AddressData | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedAddress, setSavedAddress] = useState<SavedAddress | null>(null);

  const form = useForm<ExampleFormData>({
    defaultValues: {
      country: "Türkiye",
      city: "",
      district: "",
      neighborhood: "",
      addressDetail: "",
      postalCode: "",
      entityId: "example-entity-123",
      entityType: "customer",
      name: "Örnek Müşteri"
    }
  });

  const handleAddressChange = (address: AddressData) => {
    setAddressData(address);
    console.log("Address changed:", address);
  };

  const onSubmit = async (data: ExampleFormData) => {
    setSaving(true);
    try {
      const addressToSave: SavedAddress = {
        entity_id: data.entityId,
        entity_type: data.entityType,
        country: data.country,
        city: data.city,
        district: data.district,
        neighborhood: data.neighborhood,
        address_detail: data.addressDetail,
        postal_code: data.postalCode
      };

      const result = await addressService.saveAddress(addressToSave);

      if (result.error) {
        console.error("Error saving address:", result.error);
        alert("Adres kaydedilirken hata oluştu: " + result.error.message);
      } else {
        console.log("Address saved successfully:", result.data);
        setSavedAddress(result.data);
        alert("Adres başarıyla kaydedildi!");
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      alert("Beklenmeyen bir hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  const handleLoadExampleAddress = () => {
    form.setValue("country", "Türkiye");
    form.setValue("city", "İstanbul");
    form.setValue("district", "Kadıköy");
    form.setValue("neighborhood", "Moda");
    form.setValue("addressDetail", "Örnek Mahallesi, Örnek Sokak No: 123, Daire: 4");
    form.setValue("postalCode", "34710");
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Türkiye Adres Seçici - Örnek Kullanım
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Bu örnek, AddressSelectorTR komponentinin nasıl kullanılacağını gösterir.
            Komponent 3 seviyeli dropdown (İl → İlçe → Mahalle) ile Türkiye adres seçimi sağlar.
          </p>

          <div className="flex gap-2 mb-6">
            <Button onClick={handleLoadExampleAddress} variant="outline" size="sm">
              Örnek Adres Yükle
            </Button>
            <Button onClick={() => form.reset()} variant="outline" size="sm">
              Formu Temizle
            </Button>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Address Selector Component */}
              <AddressSelectorTR
                control={form.control}
                onChange={handleAddressChange}
                required={true}
                showCard={true}
              />

              <Separator />

              {/* Submit Button */}
              <div className="flex justify-end">
                <Button type="submit" disabled={saving} className="min-w-[120px]">
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Kaydediliyor...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Adresi Kaydet
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Address Data Display */}
      {addressData && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Seçilen Adres Bilgileri</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Ülke:</strong> {addressData.country}
              </div>
              <div>
                <strong>İl:</strong> {addressData.city}
              </div>
              <div>
                <strong>İlçe:</strong> {addressData.district}
              </div>
              <div>
                <strong>Mahalle:</strong> {addressData.neighborhood}
              </div>
              <div className="col-span-2">
                <strong>Adres Detayı:</strong> {addressData.addressDetail || "Belirtilmemiş"}
              </div>
              <div>
                <strong>Posta Kodu:</strong> {addressData.postalCode || "Belirtilmemiş"}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Saved Address Display */}
      {savedAddress && (
        <Card className="border-green-200 bg-green-50/50">
          <CardHeader>
            <CardTitle className="text-lg text-green-800">Kaydedilen Adres</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-green-700">
              <p><strong>ID:</strong> {savedAddress.id}</p>
              <p><strong>Entity ID:</strong> {savedAddress.entity_id}</p>
              <p><strong>Entity Type:</strong> {savedAddress.entity_type}</p>
              <p><strong>Tam Adres:</strong> {savedAddress.neighborhood}, {savedAddress.district}, {savedAddress.city}</p>
              <p><strong>Kayıt Tarihi:</strong> {savedAddress.created_at}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Usage Information */}
      <Card className="bg-blue-50/50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-lg text-blue-800">Kullanım Bilgileri</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-700 space-y-2">
          <h4 className="font-semibold">Özellikler:</h4>
          <ul className="list-disc list-inside space-y-1">
            <li>3 seviyeli adres seçimi: İl → İlçe → Mahalle</li>
            <li>https://turkiyeapi.dev API'si ile gerçek zamanlı veri</li>
            <li>Bellek içi cache sistemi (24 saat)</li>
            <li>Yükleme durumu göstergeleri</li>
            <li>Otomatik posta kodu doldurma</li>
            <li>Adres özeti gösterimi</li>
            <li>Supabase entegrasyonu ile kaydetme</li>
            <li>Koordinat desteği (gelecekte Google Maps/OpenStreetMap)</li>
          </ul>

          <h4 className="font-semibold mt-4">Kullanım:</h4>
          <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">{`import { AddressSelectorTR } from "@/components/forms/AddressSelectorTR";

<AddressSelectorTR
  control={form.control}
  onChange={(address) => console.log(address)}
  required={true}
  showCard={true}
  fieldPrefix="address" // optional
/>`}</pre>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddressSelectorExample;