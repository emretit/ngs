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
    <div className="space-y-4">
      {/* İletişim Bilgileri */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
          <div className="w-1 h-4 bg-primary rounded-full"></div>
          İletişim Bilgileri
        </h3>
        
        <div className="space-y-4">
          {/* First Row: Contact Person, Email */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                <span>Yetkili Kişi *</span>
              </Label>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Yetkili kişi adı giriniz"
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-500" />
                <span>E-posta</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
                className="h-11"
              />
            </div>
          </div>
          
          {/* Second Row: Phone Numbers & Representative */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="mobile_phone" className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Phone className="w-4 h-4 text-green-500" />
                <span>Cep Telefonu</span>
              </Label>
              <PhoneInput
                id="mobile_phone"
                value={formData.mobile_phone ? formatPhoneNumber(formData.mobile_phone) : ""}
                onChange={(value) => setFormData({ ...formData, mobile_phone: getDigitsOnly(value) })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="office_phone" className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Phone className="w-4 h-4 text-orange-500" />
                <span>İş Telefonu</span>
              </Label>
              <PhoneInput
                id="office_phone"
                value={formData.office_phone ? formatPhoneNumber(formData.office_phone) : ""}
                onChange={(value) => setFormData({ ...formData, office_phone: getDigitsOnly(value) })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="representative" className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-500" />
                <span>Temsilci</span>
              </Label>
              <Input
                id="representative"
                value={formData.representative}
                onChange={(e) => setFormData({ ...formData, representative: e.target.value })}
                placeholder="Temsilci adı (opsiyonel)"
                className="h-11"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Temsilci ve Finansal Bilgiler */}
      <div className="space-y-4 pt-4 border-t border-gray-100">
        <RepresentativeSelect formData={formData} setFormData={setFormData} />
        
        <div className="space-y-2">
          <Label htmlFor="balance" className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-gray-600" />
            <span>Başlangıç Bakiyesi</span>
          </Label>
          <Input
            id="balance"
            type="number"
            step="0.01"
            value={formData.balance}
            onChange={(e) => setFormData({ ...formData, balance: parseFloat(e.target.value) || 0 })}
            placeholder="0.00"
            className="text-sm h-11"
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
