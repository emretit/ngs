
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
    <div className="space-y-6">
      {/* Top Row - Customer & Contact Information Combined */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Müşteri Bilgileri */}
        <Card className="shadow-xl border border-border/50 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-50 to-blue-50/50 border border-blue-200/50">
                <Building2 className="h-4 w-4 text-blue-600" />
              </div>
              Müşteri Bilgileri
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            <CompanyBasicInfo formData={formData} setFormData={setFormData} />
          </CardContent>
        </Card>

        {/* İletişim Bilgileri */}
        <Card className="shadow-xl border border-border/50 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-green-50 to-green-50/50 border border-green-200/50">
                <User className="h-4 w-4 text-green-600" />
              </div>
              İletişim Bilgileri
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            <ContactInformation formData={formData} setFormData={setFormData} />
          </CardContent>
        </Card>
      </div>

      {/* Şirket Bilgileri - Alt Kısım (Sadece Kurumsal) */}
      <CompanyInformation formData={formData} setFormData={setFormData} />

      {/* E-Fatura Bilgileri - Alt Kısım (Tam Genişlik) */}
      <Card className="shadow-xl border border-border/50 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-50 to-purple-50/50 border border-purple-200/50">
              <Receipt className="h-4 w-4 text-purple-600" />
            </div>
            E-Fatura Bilgileri
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          <div className="space-y-3">
            <Label htmlFor="einvoice_alias_name" className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-600" />
              <span>E-Fatura Alias</span>
            </Label>
            <Input
              id="einvoice_alias_name"
              value={formData.einvoice_alias_name}
              onChange={(e) => setFormData({ ...formData, einvoice_alias_name: e.target.value })}
              placeholder="urn:mail:defaultpk-cgbilgi-4-6-2-c-2@mersel.io"
              className="font-mono text-sm"
            />
            <div className="flex items-start gap-2 p-3 bg-purple-50 rounded-lg border border-purple-100">
              <div className="w-1 h-1 bg-purple-600 rounded-full mt-1.5 flex-shrink-0"></div>
              <p className="text-xs text-purple-700 leading-relaxed">
                E-fatura gönderimlerinde kullanılacak alias adresi. VKN ile müşteri bilgileri çekildiğinde otomatik olarak doldurulur.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
};

export default CustomerFormFields;
