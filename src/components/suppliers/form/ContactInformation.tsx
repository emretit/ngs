import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import { SupplierFormData } from "@/types/supplier";
import { User, Mail, Phone, Users, Globe, FileText } from "lucide-react";
import { getDigitsOnly, formatPhoneNumber } from "@/utils/phoneFormatter";

interface ContactInformationProps {
  formData: SupplierFormData;
  setFormData: (value: SupplierFormData) => void;
}

const ContactInformation = ({ formData, setFormData }: ContactInformationProps) => {
  return (
    <div className="space-y-4">
      {/* İki sütunlu yapı */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Sol sütun - Temel Bilgiler */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <User className="w-3 h-3 text-primary" />
              <span>Yetkili Kişi *</span>
            </Label>
            <Input
              id="name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Yetkili kişi adı giriniz"
              className="h-10"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <Mail className="w-3 h-3 text-blue-500" />
              <span>E-posta</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@example.com"
              className="h-10"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="representative" className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <Users className="w-3 h-3 text-indigo-500" />
              <span>Temsilci</span>
            </Label>
            <Input
              id="representative"
              value={formData.representative}
              onChange={(e) => setFormData({ ...formData, representative: e.target.value })}
              placeholder="Temsilci adı (opsiyonel)"
              className="h-10"
            />
          </div>
        </div>

        {/* Sağ sütun - İletişim */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mobile_phone" className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <Phone className="w-3 h-3 text-green-500" />
              <span>Cep Telefonu</span>
            </Label>
            <PhoneInput
              id="mobile_phone"
              value={formData.mobile_phone ? formatPhoneNumber(formData.mobile_phone) : ""}
              onChange={(value) => setFormData({ ...formData, mobile_phone: getDigitsOnly(value) })}
              className="h-10"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="office_phone" className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <Phone className="w-3 h-3 text-orange-500" />
              <span>İş Telefonu</span>
            </Label>
            <PhoneInput
              id="office_phone"
              value={formData.office_phone ? formatPhoneNumber(formData.office_phone) : ""}
              onChange={(value) => setFormData({ ...formData, office_phone: getDigitsOnly(value) })}
              className="h-10"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fax" className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <FileText className="w-3 h-3 text-gray-500" />
              <span>Faks</span>
            </Label>
            <PhoneInput
              id="fax"
              value={formData.fax ? formatPhoneNumber(formData.fax) : ""}
              onChange={(value) => setFormData({ ...formData, fax: getDigitsOnly(value) })}
              className="h-10"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="website" className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <Globe className="w-3 h-3 text-purple-500" />
              <span>Web Sitesi</span>
            </Label>
            <Input
              id="website"
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              placeholder="https://www.example.com"
              className="h-10"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactInformation;
