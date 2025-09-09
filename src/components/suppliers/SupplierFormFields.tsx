import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PhoneInput } from "@/components/ui/phone-input";
import { SupplierFormData } from "@/types/supplier";
import { User, Mail, Phone, Building, FileText, MapPin, Users, Building2, DollarSign } from "lucide-react";
import { getDigitsOnly, formatPhoneNumber } from "@/utils/phoneFormatter";
import SupplierBasicInfo from "./form/SupplierBasicInfo";
import ContactInformation from "./form/ContactInformation";

interface SupplierFormFieldsProps {
  formData: SupplierFormData;
  setFormData: (value: SupplierFormData) => void;
}

const SupplierFormFields = ({ formData, setFormData }: SupplierFormFieldsProps) => {
  return (
    <div className="w-full space-y-6">
      {/* Şirket ve Adres Bilgileri - Üst Kısım (Tam Genişlik) */}
      <Card className="border border-border/50 shadow-md bg-white">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-lg font-semibold">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <span>Tedarikçi Bilgileri</span>
            <div className="ml-auto text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-full font-medium">
              Zorunlu
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <SupplierBasicInfo formData={formData} setFormData={setFormData} />
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

      {/* Finansal Bilgiler */}
      <Card className="border border-border/50 shadow-md bg-white">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-lg font-semibold">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
            <span>Finansal Bilgiler</span>
            <div className="ml-auto text-xs bg-emerald-100 text-emerald-600 px-3 py-1.5 rounded-full font-medium">
              Opsiyonel
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="balance" className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <DollarSign className="w-3 h-3 text-emerald-500" />
              <span>Başlangıç Bakiye</span>
            </Label>
            <Input
              id="balance"
              type="number"
              value={formData.balance}
              onChange={(e) =>
                setFormData({ ...formData, balance: parseFloat(e.target.value) || 0 })
              }
              placeholder="0.00"
              className="h-10"
            />
            <p className="text-xs text-muted-foreground">
              Pozitif değer alacak, negatif değer borç anlamına gelir
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SupplierFormFields;