import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CustomerFormData } from "@/types/customer";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import AddressFields from "@/components/shared/AddressFields";
import { useNilveraCompanyInfo } from "@/hooks/useNilveraCompanyInfo";
import { useEffect } from "react";

interface CompanyBasicInfoProps {
  formData: CustomerFormData;
  setFormData: (value: CustomerFormData | ((prev: CustomerFormData) => CustomerFormData)) => void;
}

const CompanyBasicInfo = ({ formData, setFormData }: CompanyBasicInfoProps) => {
  const { searchMukellef, isLoading: isNilveraLoading, mukellefInfo, error: nilveraError } = useNilveraCompanyInfo();

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
      setFormData((prevFormData) => ({
        ...prevFormData,
        // Nilvera mükellef bilgilerini form data'ya ekle
        company: prevFormData.company || mukellefInfo.companyName || prevFormData.company,
        tax_office: prevFormData.tax_office || mukellefInfo.taxOffice || prevFormData.tax_office,
        address: prevFormData.address || mukellefInfo.address || prevFormData.address,
        // E-fatura mükellefi bilgileri - mukellefInfo bulunduysa müşteri e-fatura mükellefi
        einvoice_alias_name: prevFormData.einvoice_alias_name || mukellefInfo.aliasName || prevFormData.einvoice_alias_name,
        is_einvoice_mukellef: true, // mukellefInfo bulunduysa müşteri e-fatura mükellefi
        // DocumentType bilgisini ekle
        einvoice_document_type: mukellefInfo.documentType || prevFormData.einvoice_document_type,
      }));
    }
  }, [mukellefInfo, setFormData]);

  return (
    <div className="space-y-3">
        {/* Şirket Adı - Üstte tam genişlik */}
        <div className="space-y-1.5">
          <Label htmlFor="company" className="text-xs font-medium text-gray-700">
            Şirket/Kurum Adı *
          </Label>
          <Input
            id="company"
            required
            value={formData.company}
            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            placeholder="Şirket/Kurum adı giriniz"
            className="h-7 text-xs"
          />
        </div>

        {/* Vergi Bilgileri - Alt kısımda yan yana */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="tax_number" className="text-xs font-medium text-gray-700">
              Vergi No / TC Kimlik
            </Label>
            <div className="relative">
              <Input
                id="tax_number"
                value={formData.tax_number}
                onChange={(e) => setFormData({ ...formData, tax_number: e.target.value })}
                placeholder="1234567890"
                className="h-7 text-xs pr-32"
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

          <div className="space-y-1.5">
            <Label htmlFor="tax_office" className="text-xs font-medium text-gray-700">
              Vergi Dairesi
            </Label>
            <Input
              id="tax_office"
              value={formData.tax_office}
              onChange={(e) => setFormData({ ...formData, tax_office: e.target.value })}
              placeholder="Vergi dairesi"
              className="h-7 text-xs"
            />
          </div>
        </div>

        {/* E-fatura mükellefi detay bilgileri ve otomatik doldurma önerisi */}
        {mukellefInfo ? (
          <div className="mt-1.5 p-1.5 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                <span className="text-xs font-medium text-green-800">E-Fatura Mükellefi Bulundu</span>
              </div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (mukellefInfo) {
                    setFormData({
                      ...formData,
                      company: mukellefInfo.companyName || formData.company,
                      tax_office: mukellefInfo.taxOffice || formData.tax_office,
                      address: mukellefInfo.address || formData.address,
                      city: mukellefInfo.city || formData.city,
                      district: mukellefInfo.district || formData.district,
                      einvoice_alias_name: mukellefInfo.aliasName || formData.einvoice_alias_name,
                      einvoice_document_type: mukellefInfo.documentType || formData.einvoice_document_type,
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
              {mukellefInfo.documentType && (
                <div>
                  <span className="font-medium">E-Belge:</span> {
                    mukellefInfo.documentType === 'Invoice' || mukellefInfo.documentType === 'EINVOICE' ? 'E-Fatura' : 
                    mukellefInfo.documentType === 'ArchiveInvoice' || mukellefInfo.documentType === 'EARCHIVE' || mukellefInfo.documentType === 'EARCHIVETYPE2' ? 'E-Arşiv' : 
                    mukellefInfo.documentType === 'Waybill' || mukellefInfo.documentType === 'DESPATCHADVICE' ? 'E-İrsaliye' : 
                    mukellefInfo.documentType
                  }
                </div>
              )}
              {mukellefInfo.taxOffice && <div><span className="font-medium">Vergi Dairesi:</span> {mukellefInfo.taxOffice}</div>}
              {mukellefInfo.city && <div><span className="font-medium">Şehir:</span> {mukellefInfo.city}</div>}
              {mukellefInfo.district && <div><span className="font-medium">İlçe:</span> {mukellefInfo.district}</div>}
              {mukellefInfo.aliasName && <div className="col-span-2 truncate"><span className="font-medium">Alias:</span> {mukellefInfo.aliasName}</div>}
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

        {/* Adres Bilgileri */}
        <AddressFields
          city={formData.city}
          district={formData.district}
          address={formData.address}
          country={formData.country}
          postal_code={formData.postal_code}
          apartment_number={formData.apartment_number}
          unit_number={formData.unit_number}
          onCityChange={(value) => setFormData((prev) => ({ ...prev, city: value }))}
          onDistrictChange={(value) => setFormData((prev) => ({ ...prev, district: value }))}
          onAddressChange={(value) => setFormData((prev) => ({ ...prev, address: value }))}
          onCountryChange={(value) => setFormData((prev) => ({ ...prev, country: value }))}
          onPostalCodeChange={(value) => setFormData((prev) => ({ ...prev, postal_code: value }))}
          onApartmentNumberChange={(value) => setFormData((prev) => ({ ...prev, apartment_number: value }))}
          onUnitNumberChange={(value) => setFormData((prev) => ({ ...prev, unit_number: value }))}
        />

        {/* İkinci Adres Bilgileri - Accordion */}
        <div className="pt-3 mt-3 border-t border-gray-300">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="second-address" className="border-0">
              <AccordionTrigger className="text-xs font-medium text-gray-700 hover:no-underline py-2">
                İkinci Adres Bilgileri
              </AccordionTrigger>
              <AccordionContent className="pt-2">
                <AddressFields
                  city={formData.second_city}
                  district={formData.second_district}
                  address={formData.second_address}
                  country={formData.second_country}
                  postal_code={formData.second_postal_code}
                  onCityChange={(value) => setFormData((prev) => ({ ...prev, second_city: value }))}
                  onDistrictChange={(value) => setFormData((prev) => ({ ...prev, second_district: value }))}
                  onAddressChange={(value) => setFormData((prev) => ({ ...prev, second_address: value }))}
                  onCountryChange={(value) => setFormData((prev) => ({ ...prev, second_country: value }))}
                  onPostalCodeChange={(value) => setFormData((prev) => ({ ...prev, second_postal_code: value }))}
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
    </div>
  );
};

export default CompanyBasicInfo;
