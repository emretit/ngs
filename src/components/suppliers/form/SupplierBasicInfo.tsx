import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { SupplierFormData } from "@/types/supplier";
import { Building, FileText, CheckCircle, XCircle, Loader2, UserPlus, MapPin } from "lucide-react";
import SupplierTypeAndStatus from "./SupplierTypeAndStatus";
import { useNilveraCompanyInfo } from "@/hooks/useNilveraCompanyInfo";
import { useVknToCustomer } from "@/hooks/useVknToCustomer";
import { useEffect } from "react";

interface SupplierBasicInfoProps {
  formData: SupplierFormData;
  setFormData: (value: SupplierFormData) => void;
}

const SupplierBasicInfo = ({ formData, setFormData }: SupplierBasicInfoProps) => {
  const { searchMukellef, isLoading: isNilveraLoading, mukellefInfo, error: nilveraError } = useNilveraCompanyInfo();
  const { createCustomerFromVkn, isCreating } = useVknToCustomer();

  // Vergi numarası değiştiğinde otomatik kontrol yap
  useEffect(() => {
    if (formData.tax_number && formData.tax_number.length >= 10) {
      const timeoutId = setTimeout(() => {
        searchMukellef(formData.tax_number);
      }, 1000); // 1 saniye bekle

      return () => clearTimeout(timeoutId);
    }
  }, [formData.tax_number, searchMukellef]);



  // Nilvera'dan gelen mükellef bilgilerini form data'ya ekle
  useEffect(() => {
    if (mukellefInfo) {
      setFormData({
        ...formData,
        // Nilvera mükellef bilgilerini form data'ya ekle
        company: formData.company || mukellefInfo.companyName || formData.company,
        tax_office: formData.tax_office || mukellefInfo.taxOffice || formData.tax_office,
        address: formData.address || mukellefInfo.address || formData.address,
      });
    }
  }, [mukellefInfo]);

  // VKN bilgilerini tedarikçi olarak kaydet
  const handleSaveAsSupplier = async () => {
    const vknData = {
      taxNumber: formData.tax_number,
      companyName: mukellefInfo?.companyName || formData.company || '',
      aliasName: mukellefInfo?.aliasName,
      taxOffice: mukellefInfo?.taxOffice || formData.tax_office,
      address: mukellefInfo?.address || formData.address,
      city: mukellefInfo?.city,
      district: mukellefInfo?.district,
      mersisNo: mukellefInfo?.mersisNo,
      sicilNo: mukellefInfo?.sicilNo,
      accountType: mukellefInfo?.accountType,
      type: mukellefInfo?.type,
      email: formData.email,
      phone: formData.mobile_phone || formData.office_phone,
    };

    await createCustomerFromVkn(vknData);
  };

  return (
    <div className="space-y-3">
      {/* Şirket ve Vergi Bilgileri */}
      <div className="space-y-3">
        
        <div className="space-y-3">
          {/* Temel Bilgiler - Kompakt Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <div className="lg:col-span-3 space-y-1">
              <Label htmlFor="company" className="text-xs font-medium text-foreground flex items-center gap-1">
                <div className="p-1 bg-purple-100 rounded-md">
                  <Building className="w-3 h-3 text-purple-600" />
                </div>
                <span>Şirket Adı</span>
              </Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="Şirket adı giriniz"
                className="h-9 text-sm"
              />
            </div>

            <div className="lg:col-span-2 space-y-1">
              <Label htmlFor="tax_number" className="text-xs font-medium text-foreground flex items-center gap-1">
                <div className="p-1 bg-amber-100 rounded-md">
                  <FileText className="w-3 h-3 text-amber-600" />
                </div>
                <span>Vergi No / TC Kimlik *</span>
              </Label>
              <div className="relative">
                <Input
                  id="tax_number"
                  value={formData.tax_number}
                  onChange={(e) => setFormData({ ...formData, tax_number: e.target.value })}
                  placeholder="1234567890"
                  className="h-9 text-sm pr-28"
                />
                {/* E-fatura mükellefi durumu göstergesi */}
                {formData.tax_number && formData.tax_number.length >= 10 && (
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                    {isNilveraLoading ? (
                      <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
                    ) : mukellefInfo ? (
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        <span className="text-xs text-green-600 font-medium">E-Fatura</span>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="tax_office" className="text-xs font-medium text-foreground flex items-center gap-1">
                <div className="p-1 bg-amber-100 rounded-md">
                  <Building className="w-3 h-3 text-amber-600" />
                </div>
                <span>Vergi Dairesi</span>
              </Label>
              <Input
                id="tax_office"
                value={formData.tax_office}
                onChange={(e) => setFormData({ ...formData, tax_office: e.target.value })}
                placeholder="Vergi dairesi"
                className="h-9 text-sm"
              />
            </div>
          </div>
        </div>

        {/* E-fatura mükellefi detay bilgileri - Daha kompakt */}
        {mukellefInfo ? (
          <div className="mt-2 p-2 bg-success/5 border border-success/20 rounded-md">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-success" />
                <span className="text-xs font-medium text-success-foreground">E-Fatura Mükellefi Bulundu</span>
              </div>
              <div className="flex gap-1">
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
                  className="h-6 px-2 text-xs text-blue-700 hover:text-blue-800 hover:bg-blue-100"
                >
                  Otomatik Doldur
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSaveAsSupplier}
                  disabled={isCreating}
                  className="h-6 px-2 text-xs"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      Kaydediliyor...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3 h-3 mr-1" />
                      Tedarikçi Olarak Kaydet
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Sadece önemli bilgiler - tek satırda */}
            <div className="text-xs text-success-foreground space-y-1">
              <div className="flex flex-wrap gap-4">
                <span><strong>Ünvan:</strong> {mukellefInfo.companyName}</span>
                {mukellefInfo.taxOffice && <span><strong>Vergi Dairesi:</strong> {mukellefInfo.taxOffice}</span>}
                {mukellefInfo.aliasName && <span><strong>E-Fatura Alias:</strong> {mukellefInfo.aliasName}</span>}
              </div>
              {mukellefInfo.address && (
                <div><strong>Adres:</strong> {mukellefInfo.address}</div>
              )}
            </div>
          </div>
        ) : null}
        
        {/* Hata durumu - Kompakt */}
        {nilveraError && (
          <div className="mt-1 p-2 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center gap-1">
              <XCircle className="w-3 h-3 text-red-600" />
              <span className="text-xs font-medium text-red-800">Nilvera API Hatası: {nilveraError}</span>
            </div>
          </div>
        )}
      </div>

      {/* Adres Bilgileri - Kompakt Grid */}
      <div className="space-y-2">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          <div className="space-y-1">
            <Label htmlFor="city" className="text-xs font-medium text-foreground flex items-center gap-1">
              <div className="p-1 bg-blue-100 rounded-md">
                <MapPin className="w-3 h-3 text-blue-600" />
              </div>
              <span>İl</span>
            </Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="İl seçiniz"
              className="h-9 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="district" className="text-xs font-medium text-foreground flex items-center gap-1">
              <div className="p-1 bg-blue-100 rounded-md">
                <MapPin className="w-3 h-3 text-blue-600" />
              </div>
              <span>İlçe</span>
            </Label>
            <Input
              id="district"
              value={formData.district}
              onChange={(e) => setFormData({ ...formData, district: e.target.value })}
              placeholder="İlçe seçiniz"
              className="h-9 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="country" className="text-xs font-medium text-foreground flex items-center gap-1">
              <div className="p-1 bg-blue-100 rounded-md">
                <MapPin className="w-3 h-3 text-blue-600" />
              </div>
              <span>Ülke</span>
            </Label>
            <Input
              id="country"
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              placeholder="Türkiye"
              className="h-9 text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="postal_code" className="text-xs font-medium text-foreground flex items-center gap-1">
              <div className="p-1 bg-blue-100 rounded-md">
                <MapPin className="w-3 h-3 text-blue-600" />
              </div>
              <span>Posta Kodu</span>
            </Label>
            <Input
              id="postal_code"
              value={formData.postal_code}
              onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
              placeholder="34000"
              className="h-9 text-sm"
            />
          </div>
        </div>
        {/* Detaylı Adres - Tam genişlik */}
        <div className="space-y-1">
          <Label htmlFor="address" className="text-xs font-medium text-foreground flex items-center gap-1">
            <div className="p-1 bg-blue-100 rounded-md">
              <MapPin className="w-3 h-3 text-blue-600" />
            </div>
            <span>Detaylı Adres</span>
          </Label>
          <Input
            id="address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="Mahalle, sokak, bina no..."
            className="h-9 text-sm"
          />
        </div>
      </div>

      {/* Tedarikçi Tipi ve Durumu - Kompakt */}
      <div className="p-2 bg-green-50 rounded-md border border-green-200">
        <SupplierTypeAndStatus formData={formData} setFormData={setFormData} />
      </div>
    </div>
  );
};

export default SupplierBasicInfo;
