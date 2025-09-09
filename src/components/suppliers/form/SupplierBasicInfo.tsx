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
      email: formData.email,
      phone: formData.mobile_phone || formData.office_phone,
    };

    await createCustomerFromVkn(vknData);
  };

  return (
    <div className="space-y-6">
      {/* Şirket ve Vergi Bilgileri */}
      <div className="space-y-4">
        
        <div className="space-y-4">
          {/* Şirket Adı - Üstte tam genişlik */}
          <div className="space-y-2">
            <Label htmlFor="company" className="text-sm font-medium text-foreground flex items-center gap-2">
              <div className="p-1.5 bg-purple-100 rounded-lg">
                <Building className="w-4 h-4 text-purple-600" />
              </div>
              <span>Şirket Adı</span>
            </Label>
            <Input
              id="company"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              placeholder="Şirket adı giriniz"
              className="h-11"
            />
          </div>

          {/* Vergi Bilgileri - Alt kısımda yan yana */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tax_number" className="text-sm font-medium text-foreground flex items-center gap-2">
                <div className="p-1.5 bg-amber-100 rounded-lg">
                  <FileText className="w-4 h-4 text-amber-600" />
                </div>
                <span>Vergi No / TC Kimlik *</span>
              </Label>
              <div className="relative">
                <Input
                  id="tax_number"
                  value={formData.tax_number}
                  onChange={(e) => setFormData({ ...formData, tax_number: e.target.value })}
                  placeholder="1234567890"
                  className="h-11 pr-32"
                />
                {/* E-fatura mükellefi durumu göstergesi */}
                {formData.tax_number && formData.tax_number.length >= 10 && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {isNilveraLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                    ) : mukellefInfo ? (
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-xs text-green-600 font-medium">E-Fatura Mükellefi</span>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tax_office" className="text-sm font-medium text-foreground flex items-center gap-2">
                <div className="p-1.5 bg-amber-100 rounded-lg">
                  <Building className="w-4 h-4 text-amber-600" />
                </div>
                <span>Vergi Dairesi</span>
              </Label>
              <Input
                id="tax_office"
                value={formData.tax_office}
                onChange={(e) => setFormData({ ...formData, tax_office: e.target.value })}
                placeholder="Vergi dairesi"
                className="h-11"
              />
            </div>
          </div>
        </div>

        {/* E-fatura mükellefi detay bilgileri ve otomatik doldurma önerisi */}
        {mukellefInfo ? (
          <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">E-Fatura Mükellefi Bulundu</span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleSaveAsSupplier}
                disabled={isCreating}
                className="h-7 px-2 text-xs bg-white hover:bg-green-50 border-green-300 text-green-700 hover:text-green-800"
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
            <div className="space-y-1 text-xs text-green-700 mb-2">
              <div><strong>Şirket:</strong> {mukellefInfo.companyName}</div>
              {mukellefInfo.aliasName && <div><strong>E-Fatura Alias:</strong> {mukellefInfo.aliasName}</div>}
              {mukellefInfo.taxOffice && <div><strong>Vergi Dairesi:</strong> {mukellefInfo.taxOffice}</div>}
              {mukellefInfo.address && <div><strong>Adres:</strong> {mukellefInfo.address}</div>}
              {mukellefInfo.city && <div><strong>Şehir:</strong> {mukellefInfo.city}</div>}
              {mukellefInfo.district && <div><strong>İlçe:</strong> {mukellefInfo.district}</div>}
              {mukellefInfo.mersisNo && <div><strong>Mersis No:</strong> {mukellefInfo.mersisNo}</div>}
              {mukellefInfo.sicilNo && <div><strong>Sicil No:</strong> {mukellefInfo.sicilNo}</div>}
            </div>
            
            {/* Otomatik doldurma önerisi */}
            <div className="p-1.5 bg-blue-50 border border-blue-200 rounded">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-3 h-3 text-blue-600" />
                  <span className="text-xs text-blue-800 font-medium">Bu bilgileri diğer alanlara otomatik doldurmak ister misiniz?</span>
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
                      });
                    }
                  }}
                  className="h-6 px-2 text-xs text-blue-700 hover:text-blue-800 hover:bg-blue-100"
                >
                  Evet, Doldur
                </Button>
              </div>
            </div>
          </div>
        ) : null}
        
        {/* Hata durumu */}
        {nilveraError && (
          <div className="mt-1 p-2 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="w-4 h-4 text-red-600" />
              <span className="text-sm font-medium text-red-800">Nilvera API Hatası</span>
            </div>
            <div className="text-xs text-red-700">
              {nilveraError}
            </div>
          </div>
        )}
      </div>

      {/* Adres Bilgileri */}
      <div className="space-y-4">
        
        <div className="space-y-4">
          {/* İl ve İlçe - Üst satır */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city" className="text-sm font-medium text-foreground flex items-center gap-2">
                <div className="p-1.5 bg-blue-100 rounded-lg">
                  <MapPin className="w-4 h-4 text-blue-600" />
                </div>
                <span>İl</span>
              </Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="İl seçiniz"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="district" className="text-sm font-medium text-foreground flex items-center gap-2">
                <div className="p-1.5 bg-blue-100 rounded-lg">
                  <MapPin className="w-4 h-4 text-blue-600" />
                </div>
                <span>İlçe</span>
              </Label>
              <Input
                id="district"
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                placeholder="İlçe seçiniz"
                className="h-11"
              />
            </div>
          </div>

          {/* Detaylı Adres - Alt satır tam genişlik */}
          <div className="space-y-2">
            <Label htmlFor="address" className="text-sm font-medium text-foreground flex items-center gap-2">
              <div className="p-1.5 bg-blue-100 rounded-lg">
                <MapPin className="w-4 h-4 text-blue-600" />
              </div>
              <span>Detaylı Adres</span>
            </Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Mahalle, sokak, bina no..."
              className="h-11"
            />
          </div>
        </div>
      </div>

      {/* Tedarikçi Tipi ve Durumu */}
      <div className="space-y-3">
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <SupplierTypeAndStatus formData={formData} setFormData={setFormData} />
        </div>
      </div>
    </div>
  );
};

export default SupplierBasicInfo;
