import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import { CustomerFormData } from "@/types/customer";
import { User, Mail, Phone, Users, DollarSign } from "lucide-react";
import { getDigitsOnly, formatPhoneNumber } from "@/utils/phoneFormatter";
import RepresentativeSelect from "./RepresentativeSelect";

interface ContactInformationProps {
  formData: CustomerFormData;
  setFormData: (value: CustomerFormData) => void;
}

const ContactInformation = ({ formData, setFormData }: ContactInformationProps) => {
  return (
    <div className="space-y-3">
      {/* İletişim Bilgileri */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-foreground">
          İletişim Bilgileri
        </h3>
        
        <div className="space-y-2">
          {/* First Row: Contact Person, Email */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-medium text-gray-700">
                Yetkili Kişi *
              </Label>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Yetkili kişi adı giriniz"
                className="text-sm h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-medium text-gray-700">
                E-posta
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
                className="text-sm h-9"
              />
            </div>
          </div>
          
          {/* Second Row: Phone Numbers & Representative */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="mobile_phone" className="text-xs font-medium text-gray-700">
                Cep Telefonu
              </Label>
              <PhoneInput
                id="mobile_phone"
                value={formData.mobile_phone ? formatPhoneNumber(formData.mobile_phone) : ""}
                onChange={(value) => setFormData({ ...formData, mobile_phone: getDigitsOnly(value) })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="office_phone" className="text-xs font-medium text-gray-700">
                İş Telefonu
              </Label>
              <PhoneInput
                id="office_phone"
                value={formData.office_phone ? formatPhoneNumber(formData.office_phone) : ""}
                onChange={(value) => setFormData({ ...formData, office_phone: getDigitsOnly(value) })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="representative" className="text-xs font-medium text-gray-700">
                Temsilci
              </Label>
              <Input
                id="representative"
                value={formData.representative}
                onChange={(e) => setFormData({ ...formData, representative: e.target.value })}
                placeholder="Temsilci adı (opsiyonel)"
                className="text-sm h-9"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Temsilci ve Finansal Bilgiler */}
      <div className="space-y-4 pt-4 border-t border-gray-100">
        <RepresentativeSelect formData={formData} setFormData={setFormData} />
        
        <div className="space-y-1.5">
          <Label htmlFor="balance" className="text-xs font-medium text-gray-700">
            Başlangıç Bakiyesi
          </Label>
          <Input
            id="balance"
            type="number"
            step="0.01"
            value={formData.balance}
            onChange={(e) => setFormData({ ...formData, balance: parseFloat(e.target.value) || 0 })}
            placeholder="0.00"
            className="text-sm h-9"
          />
          <p className="text-xs text-gray-500">
            Pozitif: alacak, negatif: borç
          </p>
        </div>
      </div>
    </div>
  );
};

export default ContactInformation;
