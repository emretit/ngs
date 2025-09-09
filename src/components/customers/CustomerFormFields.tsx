
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="w-full space-y-6">
      {/* Şirket ve Adres Bilgileri - Üst Kısım (Tam Genişlik) */}
      <Card className="border border-border/50 shadow-md bg-white">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-lg font-semibold">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <span>Müşteri Bilgileri</span>
            <div className="ml-auto text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-full font-medium">
              Zorunlu
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <CompanyBasicInfo formData={formData} setFormData={setFormData} />
        </CardContent>
      </Card>

      {/* İletişim ve Ek Bilgiler - Orta Kısım */}
      <Card className="border border-border/50 shadow-md bg-white">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-lg font-semibold">
            <div className="p-2 bg-blue-100 rounded-lg">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <span>İletişim ve Ek Bilgiler</span>
            <div className="ml-auto text-xs bg-blue-100 text-blue-600 px-3 py-1.5 rounded-full font-medium">
              Zorunlu/Opsiyonel
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ContactInformation formData={formData} setFormData={setFormData} />
        </CardContent>
      </Card>

      {/* Şirket Bilgileri - Orta Kısım (Sadece Kurumsal) */}
      <CompanyInformation formData={formData} setFormData={setFormData} />

      {/* E-Fatura Bilgileri - Alt Kısım (Tam Genişlik) */}
      <Card className="border border-border/50 shadow-md bg-white">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-lg font-semibold">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Receipt className="w-5 h-5 text-blue-600" />
            </div>
            <span>E-Fatura Bilgileri</span>
            <div className="ml-auto text-xs bg-blue-100 text-blue-600 px-3 py-1.5 rounded-full font-medium">
              Opsiyonel
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="space-y-3">
              <Label htmlFor="einvoice_alias_name" className="text-sm font-medium text-blue-700 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>E-Fatura Alias</span>
              </Label>
              <Input
                id="einvoice_alias_name"
                value={formData.einvoice_alias_name}
                onChange={(e) => setFormData({ ...formData, einvoice_alias_name: e.target.value })}
                placeholder="urn:mail:defaultpk-cgbilgi-4-6-2-c-2@mersel.io"
                className="font-mono text-sm border-blue-200 focus:border-blue-400 bg-white h-11"
              />
              <div className="flex items-start gap-3 p-3 bg-blue-100 rounded-lg">
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-xs text-blue-700 leading-relaxed">
                  E-fatura gönderimlerinde kullanılacak alias adresi. VKN ile müşteri bilgileri çekildiğinde otomatik olarak doldurulur.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
};

export default CustomerFormFields;
