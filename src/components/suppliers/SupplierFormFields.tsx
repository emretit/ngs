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
    <div className="w-full space-y-6">
      {/* Ana Bilgiler - Geniş Kart */}
      <Card className="border border-border/50 shadow-sm bg-white">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-lg font-semibold">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <span>Tedarikçi Bilgileri</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <SupplierBasicInfoCompact formData={formData} setFormData={setFormData} />

          {/* İletişim Bilgileri - Geniş bölüm */}
          <div className="pt-4 border-t border-border/20">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-4 h-4 text-blue-600" />
              <h4 className="text-base font-medium text-muted-foreground">İletişim Bilgileri</h4>
            </div>
            <ContactInformationCompact formData={formData} setFormData={setFormData} />
          </div>

          {/* Finansal ve Ödeme Bilgileri - Geniş tasarım */}
          <div className="pt-4 border-t border-border/20">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <h4 className="text-base font-medium text-muted-foreground">Finansal ve Ödeme Bilgileri</h4>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Sol Sütun - Finansal */}
              <div className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="balance" className="text-xs font-medium text-muted-foreground flex items-center gap-1">
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
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="einvoice_alias_name" className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <Tag className="w-3 h-3 text-purple-500" />
                      <span>E-Fatura Takma Adı</span>
                    </Label>
                    <Input
                      id="einvoice_alias_name"
                      value={formData.einvoice_alias_name}
                      onChange={(e) => setFormData({ ...formData, einvoice_alias_name: e.target.value })}
                      placeholder="E-fatura takma adı"
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Pozitif değer alacak, negatif değer borç anlamına gelir
                </p>
              </div>

              {/* Sağ Sütun - Ödeme */}
              <div className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="payee_financial_account_id" className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <CreditCard className="w-3 h-3 text-blue-500" />
                      <span>Finansal Hesap ID</span>
                    </Label>
                    <Input
                      id="payee_financial_account_id"
                      value={formData.payee_financial_account_id}
                      onChange={(e) => setFormData({ ...formData, payee_financial_account_id: e.target.value })}
                      placeholder="Finansal hesap ID"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="payment_means_code" className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <Settings className="w-3 h-3 text-blue-500" />
                      <span>Ödeme Yöntemi</span>
                    </Label>
                    <Input
                      id="payment_means_code"
                      value={formData.payment_means_code}
                      onChange={(e) => setFormData({ ...formData, payment_means_code: e.target.value })}
                      placeholder="Ödeme yöntemi"
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="payment_means_channel_code" className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Settings className="w-3 h-3 text-blue-500" />
                    <span>Ödeme Kanal Kodu</span>
                  </Label>
                  <Input
                    id="payment_means_channel_code"
                    value={formData.payment_means_channel_code}
                    onChange={(e) => setFormData({ ...formData, payment_means_channel_code: e.target.value })}
                    placeholder="Ödeme kanal kodu"
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SupplierFormFields;