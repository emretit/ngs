
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { CustomerFormData } from "@/types/customer";
import CompanyBasicInfo from "./form/CompanyBasicInfo";
import ContactInformation from "./form/ContactInformation";
import CompanyInformation from "./form/CompanyInformation";
import { User, Building2, Receipt, FileText } from "lucide-react";

interface CustomerFormFieldsProps {
  formData: CustomerFormData;
  setFormData: (value: CustomerFormData) => void;
}

const CustomerFormFields = ({ formData, setFormData }: CustomerFormFieldsProps) => {
  return (
    <div className="space-y-4">
      {/* Top Row - Customer & Contact Information Combined */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Müşteri Bilgileri */}
        <Card className="shadow-xl border border-border/50 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm rounded-2xl">
          <CardHeader className="pb-2 pt-2.5">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-50 to-blue-50/50 border border-blue-200/50">
                <Building2 className="h-4 w-4 text-blue-600" />
              </div>
              Müşteri Bilgileri
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 pt-0 px-3 pb-3">
            <CompanyBasicInfo formData={formData} setFormData={setFormData} />
          </CardContent>
        </Card>

        {/* İletişim Bilgileri */}
        <Card className="shadow-xl border border-border/50 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm rounded-2xl">
          <CardHeader className="pb-2 pt-2.5">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-green-50 to-green-50/50 border border-green-200/50">
                <User className="h-4 w-4 text-green-600" />
              </div>
              İletişim Bilgileri
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 pt-0 px-3 pb-3">
            <ContactInformation formData={formData} setFormData={setFormData} />
          </CardContent>
        </Card>
      </div>

      {/* Şirket Bilgileri - Alt Kısım (Sadece Kurumsal) */}
      <CompanyInformation formData={formData} setFormData={setFormData} />

      {/* E-Fatura ve Diğer Bilgiler - Alt Kısım (Yan Yana) */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* E-Fatura ve Banka Bilgileri */}
        <Card className="shadow-xl border border-border/50 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm rounded-2xl">
          <CardHeader className="pb-2 pt-2.5">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-50 to-purple-50/50 border border-purple-200/50">
                <Receipt className="h-4 w-4 text-purple-600" />
              </div>
              E-Fatura ve Banka Bilgileri
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 pt-0 px-3 pb-3">
            <div className="grid grid-cols-1 gap-3">
              {/* E-Fatura Alias */}
              <div className="space-y-1.5">
                <Label htmlFor="einvoice_alias_name" className="text-xs font-medium text-gray-700 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-purple-600" />
                  <span>E-Fatura Alias</span>
                </Label>
                <Input
                  id="einvoice_alias_name"
                  value={formData.einvoice_alias_name}
                  onChange={(e) => setFormData({ ...formData, einvoice_alias_name: e.target.value })}
                  placeholder="urn:mail:defaultpk-cgbilgi-4-6-2-c-2@mersel.io"
                  className="font-mono h-7 text-xs"
                />
                <p className="text-xs text-purple-600/70">
                  VKN ile müşteri bilgileri çekildiğinde otomatik doldurulur
                </p>
              </div>

              {/* Banka Bilgileri */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                <div className="space-y-1.5">
                  <Label htmlFor="bank_name" className="text-xs font-medium text-gray-700">
                    Banka Adı
                  </Label>
                  <Input
                    id="bank_name"
                    value={formData.bank_name}
                    onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                    placeholder="Türkiye İş Bankası"
                    className="h-7 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="iban" className="text-xs font-medium text-gray-700">
                    IBAN
                  </Label>
                  <Input
                    id="iban"
                    value={formData.iban}
                    onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
                    placeholder="TR00 0000 0000 0000 0000 0000 00"
                    className="h-7 text-xs"
                  />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="account_number" className="text-xs font-medium text-gray-700">
                    Hesap No
                  </Label>
                  <Input
                    id="account_number"
                    value={formData.account_number}
                    onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                    placeholder="1234567890"
                    className="h-7 text-xs"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Diğer Bilgiler */}
        <Card className="shadow-xl border border-border/50 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm rounded-2xl">
          <CardHeader className="pb-2 pt-2.5">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-orange-50 to-orange-50/50 border border-orange-200/50">
                <FileText className="h-4 w-4 text-orange-600" />
              </div>
              Diğer Bilgiler
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 pt-0 px-3 pb-3">
            <div className="grid grid-cols-1 gap-3">

              {/* Ticaret Sicil Bilgileri */}
              <div className="pt-2 border-t border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="trade_registry_number" className="text-xs font-medium text-gray-700">
                      Ticaret Sicil No
                    </Label>
                    <Input
                      id="trade_registry_number"
                      value={formData.trade_registry_number}
                      onChange={(e) => setFormData({ ...formData, trade_registry_number: e.target.value })}
                      placeholder="123456"
                      className="h-7 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="mersis_number" className="text-xs font-medium text-gray-700">
                      MERSİS No
                    </Label>
                    <Input
                      id="mersis_number"
                      value={formData.mersis_number}
                      onChange={(e) => setFormData({ ...formData, mersis_number: e.target.value })}
                      placeholder="0123456789012345"
                      className="h-7 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Müşteri Detay Bilgileri */}
              <div className="pt-2 border-t border-gray-100">
                <div className="grid grid-cols-1 gap-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="establishment_date" className="text-xs font-medium text-gray-700">
                        Kuruluş Tarihi
                      </Label>
                      <DatePicker
                        date={formData.establishment_date ? new Date(formData.establishment_date) : undefined}
                        onSelect={(date) => setFormData({ 
                          ...formData, 
                          establishment_date: date ? date.toISOString().split('T')[0] : "" 
                        })}
                        placeholder="Kuruluş tarihi seçiniz"
                        className="h-7 text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="sector" className="text-xs font-medium text-gray-700">
                        Sektör/Faaliyet Alanı
                      </Label>
                      <Input
                        id="sector"
                        value={formData.sector}
                        onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                        placeholder="Teknoloji, İnşaat, Ticaret..."
                        className="h-7 text-xs"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="customer_segment" className="text-xs font-medium text-gray-700">
                        Müşteri Segmenti
                      </Label>
                      <Input
                        id="customer_segment"
                        value={formData.customer_segment}
                        onChange={(e) => setFormData({ ...formData, customer_segment: e.target.value })}
                        placeholder="Kurumsal, KOBİ, Bireysel..."
                        className="h-7 text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="customer_source" className="text-xs font-medium text-gray-700">
                        Müşteri Kaynağı
                      </Label>
                      <Input
                        id="customer_source"
                        value={formData.customer_source}
                        onChange={(e) => setFormData({ ...formData, customer_source: e.target.value })}
                        placeholder="Web sitesi, Referans, Reklam..."
                        className="h-7 text-xs"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="notes" className="text-xs font-medium text-gray-700">
                      Notlar
                    </Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Müşteri hakkında özel notlar..."
                      className="h-7 text-xs resize-none min-h-[60px]"
                    />
                  </div>
                </div>
              </div>



            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
};

export default CustomerFormFields;
