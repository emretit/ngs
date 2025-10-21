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
import SupplierBasicInfoCompact from "./form/SupplierBasicInfoCompact";
import ContactInformationCompact from "./form/ContactInformationCompact";

interface SupplierFormFieldsProps {
  formData: SupplierFormData;
  setFormData: (value: SupplierFormData) => void;
}

const SupplierFormFields = ({ formData, setFormData }: SupplierFormFieldsProps) => {
  return (
    <div className="space-y-4">
      {/* Top Row - Supplier & Contact Information Combined */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Tedarikçi Bilgileri */}
        <Card className="shadow-xl border border-border/50 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm rounded-2xl">
          <CardHeader className="pb-2 pt-2.5">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-50 to-blue-50/50 border border-blue-200/50">
                <Building2 className="h-4 w-4 text-blue-600" />
              </div>
              Tedarikçi Bilgileri
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 pt-0 px-3 pb-3">
            <SupplierBasicInfoCompact formData={formData} setFormData={setFormData} />
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
            <ContactInformationCompact formData={formData} setFormData={setFormData} />
          </CardContent>
        </Card>
      </div>

      {/* Finansal ve Ödeme Bilgileri */}
      <Card className="shadow-xl border border-border/50 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm rounded-2xl">
        <CardHeader className="pb-2 pt-2.5">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-emerald-50 to-emerald-50/50 border border-emerald-200/50">
              <DollarSign className="h-4 w-4 text-emerald-600" />
            </div>
            Finansal ve Ödeme Bilgileri
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5 pt-0 px-3 pb-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sol Sütun - Finansal */}
            <div className="space-y-2">
              <div className="space-y-1.5">
                <Label htmlFor="balance" className="text-xs font-medium text-gray-700 mb-1.5 block flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
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
                  className="h-7 text-xs"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Pozitif değer alacak, negatif değer borç anlamına gelir
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="einvoice_alias_name" className="text-xs font-medium text-gray-700 mb-1.5 block flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-purple-600" />
                  <span>E-Fatura Takma Adı</span>
                </Label>
                <Input
                  id="einvoice_alias_name"
                  value={formData.einvoice_alias_name}
                  onChange={(e) => setFormData({ ...formData, einvoice_alias_name: e.target.value })}
                  placeholder="E-fatura takma adı"
                  className="h-7 text-xs"
                />
              </div>
            </div>

            {/* Sağ Sütun - Ödeme */}
            <div className="space-y-2">
              <div className="space-y-1.5">
                <Label htmlFor="payee_financial_account_id" className="text-xs font-medium text-gray-700 mb-1.5 block flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                  <span>Finansal Hesap ID</span>
                </Label>
                <Input
                  id="payee_financial_account_id"
                  value={formData.payee_financial_account_id}
                  onChange={(e) => setFormData({ ...formData, payee_financial_account_id: e.target.value })}
                  placeholder="Finansal hesap ID"
                  className="h-7 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="payment_means_code" className="text-xs font-medium text-gray-700 mb-1.5 block flex items-center gap-1.5">
                  <Settings className="w-3.5 h-3.5 text-blue-600" />
                  <span>Ödeme Yöntemi</span>
                </Label>
                <Input
                  id="payment_means_code"
                  value={formData.payment_means_code}
                  onChange={(e) => setFormData({ ...formData, payment_means_code: e.target.value })}
                  placeholder="Ödeme yöntemi"
                  className="h-7 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="payment_means_channel_code" className="text-xs font-medium text-gray-700 mb-1.5 block flex items-center gap-1.5">
                  <Settings className="w-3.5 h-3.5 text-blue-600" />
                  <span>Ödeme Kanal Kodu</span>
                </Label>
                <Input
                  id="payment_means_channel_code"
                  value={formData.payment_means_channel_code}
                  onChange={(e) => setFormData({ ...formData, payment_means_channel_code: e.target.value })}
                  placeholder="Ödeme kanal kodu"
                  className="h-7 text-xs"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SupplierFormFields;