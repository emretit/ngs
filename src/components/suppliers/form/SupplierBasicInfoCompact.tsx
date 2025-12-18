import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SupplierFormData } from "@/types/supplier";
import { Building, FileText, CheckCircle, Loader2, MapPin, Search, User, Users, Building2 } from "lucide-react";
import AddressFields from "@/components/shared/AddressFields";
import { useNilveraCompanyInfo } from "@/hooks/useNilveraCompanyInfo";
import { useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SupplierBasicInfoCompactProps {
  formData: SupplierFormData;
  setFormData: (value: SupplierFormData) => void;
}

const SupplierBasicInfoCompact = ({ formData, setFormData }: SupplierBasicInfoCompactProps) => {
  const { searchMukellef, isLoading: isNilveraLoading, mukellefInfo, error: nilveraError } = useNilveraCompanyInfo();

  // Otomatik arama kaldırıldı - kullanıcı manuel olarak arama butonuna basacak

  // Nilvera'dan gelen mükellef bilgilerini form data'ya ekle
  useEffect(() => {
    if (mukellefInfo) {
      setFormData({
        ...formData,
        company: formData.company || mukellefInfo.companyName || formData.company,
        tax_office: formData.tax_office || mukellefInfo.taxOffice || formData.tax_office,
        address: formData.address || mukellefInfo.address || formData.address,
        city: formData.city || mukellefInfo.city || formData.city,
        district: formData.district || mukellefInfo.district || formData.district,
        einvoice_alias_name: formData.einvoice_alias_name || mukellefInfo.aliasName || formData.einvoice_alias_name,
      });
    }
  }, [mukellefInfo]);


  return (
    <div className="space-y-3">
      {/* Vergi Bilgileri - En Üstte */}
      <div className="space-y-1">
        <Label htmlFor="tax_number" className="text-xs font-medium text-gray-700">
          Vergi Numarası *
        </Label>
        <div className="flex gap-2">
          <Input
            id="tax_number"
            value={formData.tax_number}
            onChange={(e) => setFormData({ ...formData, tax_number: e.target.value })}
            placeholder="Vergi Numarası"
            className="h-7 text-xs flex-1"
            required
          />
          <Button
            type="button"
            variant="default"
            onClick={() => searchMukellef(formData.tax_number)}
            disabled={isNilveraLoading || !formData.tax_number || formData.tax_number.length < 10}
            className="h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isNilveraLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                Aranıyor...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-1" />
                Ara
              </>
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Vergi numarasını girdikten sonra "Ara" butonuna basarak E-fatura mükellefi bilgilerini sorgulayabilirsiniz.
        </p>
      </div>

      {/* E-fatura mükellefi detay bilgileri - Vergi numarası altında */}
      {mukellefInfo ? (
        <div className="mt-2 p-1.5 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-green-600" />
              <span className="text-xs font-medium text-green-800">E-Fatura Mükellefi Bulundu</span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                if (mukellefInfo) {
                  setFormData({
                    ...formData,
                    company: mukellefInfo.companyName || formData.company,
                    tax_office: mukellefInfo.taxOffice || formData.tax_office,
                    address: mukellefInfo.address || formData.address,
                    city: mukellefInfo.city || formData.city,
                    district: mukellefInfo.district || formData.district,
                    einvoice_alias_name: mukellefInfo.aliasName || formData.einvoice_alias_name,
                  });
                }
              }}
              className="h-6 px-2 text-xs text-green-700 hover:text-green-800 hover:bg-green-100"
            >
              Otomatik Doldur
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[10px] text-green-700">
            <div><span className="font-medium">Şirket:</span> {mukellefInfo.companyName}</div>
            {mukellefInfo.taxOffice && <div><span className="font-medium">Vergi Dairesi:</span> {mukellefInfo.taxOffice}</div>}
            {mukellefInfo.city && <div><span className="font-medium">Şehir:</span> {mukellefInfo.city}</div>}
            {mukellefInfo.district && <div><span className="font-medium">İlçe:</span> {mukellefInfo.district}</div>}
            {mukellefInfo.aliasName && <div className="col-span-2 truncate"><span className="font-medium">Alias:</span> {mukellefInfo.aliasName}</div>}
          </div>
        </div>
      ) : null}

      {/* Hata mesajı */}
      {nilveraError && (
        <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span className="text-xs text-red-700">
              E-fatura mükellefi bulunamadı: {nilveraError}
            </span>
          </div>
        </div>
      )}

      {/* Temel Bilgiler - Geniş */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="name" className="text-xs font-medium text-gray-700">
            Ad Soyad / Yetkili Kişi *
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ad Soyad veya Yetkili Kişi"
            className="h-7 text-xs"
            required
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="company" className="text-xs font-medium text-gray-700">
            Şirket Adı *
          </Label>
          <Input
            id="company"
            value={formData.company}
            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            placeholder="Şirket Adı"
            className="h-7 text-xs"
            required
          />
        </div>
      </div>

      {/* Vergi Dairesi */}
      <div className="space-y-1">
        <Label htmlFor="tax_office" className="text-xs font-medium text-gray-700">
          Vergi Dairesi *
        </Label>
        <Input
          id="tax_office"
          value={formData.tax_office}
          onChange={(e) => setFormData({ ...formData, tax_office: e.target.value })}
          placeholder="Vergi Dairesi"
          className="h-7 text-xs"
          required
        />
      </div>

      {/* Adres Bilgileri */}
      <AddressFields
        city={formData.city}
        district={formData.district}
        address={formData.address}
        country={formData.country}
        postal_code={formData.postal_code}
        onCityChange={(value) => setFormData({ ...formData, city: value })}
        onDistrictChange={(value) => setFormData({ ...formData, district: value })}
        onAddressChange={(value) => setFormData({ ...formData, address: value })}
        onCountryChange={(value) => setFormData({ ...formData, country: value })}
        onPostalCodeChange={(value) => setFormData({ ...formData, postal_code: value })}
      />

      <div className="space-y-1">
        <Label htmlFor="type" className="text-xs font-medium text-gray-700">
          Tür *
        </Label>
        <Select
          value={formData.type}
          onValueChange={(value: "bireysel" | "kurumsal") =>
            setFormData({ ...formData, type: value })
          }
        >
          <SelectTrigger className="h-7 text-xs">
            <SelectValue placeholder="Tür Seçin" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="bireysel">Bireysel</SelectItem>
            <SelectItem value="kurumsal">Kurumsal</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label htmlFor="representative" className="text-xs font-medium text-gray-700">
            Yetkili Kişi
          </Label>
          <Input
            id="representative"
            value={formData.representative}
            onChange={(e) => setFormData({ ...formData, representative: e.target.value })}
            placeholder="Yetkili Kişi"
            className="h-7 text-xs"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="status" className="text-xs font-medium text-gray-700">
            Durum *
          </Label>
          <Select
            value={formData.status}
            onValueChange={(value: "aktif" | "pasif" | "potansiyel") =>
              setFormData({ ...formData, status: value })
            }
          >
            <SelectTrigger className="h-7 text-xs">
              <SelectValue placeholder="Durum Seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="aktif">Aktif</SelectItem>
              <SelectItem value="pasif">Pasif</SelectItem>
              <SelectItem value="potansiyel">Potansiyel</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="country" className="text-xs font-medium text-gray-700">
            Ülke
          </Label>
          <Input
            id="country"
            value={formData.country}
            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
            placeholder="Türkiye"
            className="h-7 text-xs"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="postal_code" className="text-xs font-medium text-gray-700">
            Posta Kodu
          </Label>
          <Input
            id="postal_code"
            value={formData.postal_code}
            onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
            placeholder="34000"
            className="h-7 text-xs"
          />
        </div>
      </div>

    </div>
  );
};

export default SupplierBasicInfoCompact;
