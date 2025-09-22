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
import { User, Mail, Phone, Building, FileText, MapPin, Users, Building2, DollarSign, CreditCard, Settings, Tag } from "lucide-react";
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

      {/* Ödeme Bilgileri */}
      <Card className="border border-border/50 shadow-md bg-white">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-lg font-semibold">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CreditCard className="w-5 h-5 text-blue-600" />
            </div>
            <span>Ödeme Bilgileri</span>
            <div className="ml-auto text-xs bg-blue-100 text-blue-600 px-3 py-1.5 rounded-full font-medium">
              Opsiyonel
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="payee_financial_account_id" className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <CreditCard className="w-3 h-3 text-blue-500" />
                <span>Finansal Hesap ID</span>
              </Label>
              <Input
                id="payee_financial_account_id"
                value={formData.payee_financial_account_id}
                onChange={(e) => setFormData({ ...formData, payee_financial_account_id: e.target.value })}
                placeholder="Finansal hesap ID"
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment_means_code" className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Settings className="w-3 h-3 text-blue-500" />
                <span>Ödeme Yöntemi Kodu</span>
              </Label>
              <Input
                id="payment_means_code"
                value={formData.payment_means_code}
                onChange={(e) => setFormData({ ...formData, payment_means_code: e.target.value })}
                placeholder="Ödeme yöntemi kodu"
                className="h-10"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="payment_means_channel_code" className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <Settings className="w-3 h-3 text-blue-500" />
              <span>Ödeme Kanal Kodu</span>
            </Label>
            <Input
              id="payment_means_channel_code"
              value={formData.payment_means_channel_code}
              onChange={(e) => setFormData({ ...formData, payment_means_channel_code: e.target.value })}
              placeholder="Ödeme kanal kodu"
              className="h-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* E-Fatura ve Takma Ad Bilgileri */}
      <Card className="border border-border/50 shadow-md bg-white">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-lg font-semibold">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Tag className="w-5 h-5 text-purple-600" />
            </div>
            <span>E-Fatura ve Takma Ad Bilgileri</span>
            <div className="ml-auto text-xs bg-purple-100 text-purple-600 px-3 py-1.5 rounded-full font-medium">
              Opsiyonel
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="einvoice_alias_name" className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <Tag className="w-3 h-3 text-purple-500" />
              <span>E-Fatura Takma Adı</span>
            </Label>
            <Input
              id="einvoice_alias_name"
              value={formData.einvoice_alias_name}
              onChange={(e) => setFormData({ ...formData, einvoice_alias_name: e.target.value })}
              placeholder="E-fatura takma adı"
              className="h-10"
            />
            <p className="text-xs text-muted-foreground">
              E-fatura gönderiminde kullanılacak takma ad
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SupplierFormFields;