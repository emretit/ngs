import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import { SupplierFormData } from "@/types/supplier";
import { Mail, Phone, Printer, Globe } from "lucide-react";
import { getDigitsOnly, formatPhoneNumber } from "@/utils/phoneFormatter";

interface ContactInformationCompactProps {
  formData: SupplierFormData;
  setFormData: (value: SupplierFormData) => void;
}

const ContactInformationCompact = ({ formData, setFormData }: ContactInformationCompactProps) => {
  return (
    <div className="space-y-4">
      {/* E-posta */}
      <div className="space-y-1">
        <Label htmlFor="email" className="text-sm font-medium text-muted-foreground flex items-center gap-1">
          <Mail className="w-4 h-4 text-blue-500" />
          <span>E-posta</span>
        </Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="ornek@email.com"
          className="h-10 text-sm"
        />
      </div>

      {/* Telefon numaraları - Geniş grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="mobile_phone" className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <Phone className="w-3 h-3 text-green-500" />
            <span>Cep Telefonu</span>
          </Label>
          <PhoneInput
            id="mobile_phone"
            value={formData.mobile_phone ? formatPhoneNumber(formData.mobile_phone) : ""}
            onChange={(value) => setFormData({ ...formData, mobile_phone: getDigitsOnly(value) })}
            className="h-9 text-sm"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="office_phone" className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <Phone className="w-3 h-3 text-blue-500" />
            <span>Ofis Telefonu</span>
          </Label>
          <PhoneInput
            id="office_phone"
            value={formData.office_phone ? formatPhoneNumber(formData.office_phone) : ""}
            onChange={(value) => setFormData({ ...formData, office_phone: getDigitsOnly(value) })}
            className="h-9 text-sm"
          />
        </div>
      </div>

      {/* Faks ve Web Sitesi - Geniş grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="fax" className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <Printer className="w-3 h-3 text-gray-500" />
            <span>Faks</span>
          </Label>
          <PhoneInput
            id="fax"
            value={formData.fax ? formatPhoneNumber(formData.fax) : ""}
            onChange={(value) => setFormData({ ...formData, fax: getDigitsOnly(value) })}
            className="h-9 text-sm"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="website" className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            <Globe className="w-3 h-3 text-purple-500" />
            <span>Web Sitesi</span>
          </Label>
          <Input
            id="website"
            type="url"
            value={formData.website}
            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            placeholder="https://www.example.com"
            className="h-9 text-sm"
          />
        </div>
      </div>
    </div>
  );
};

export default ContactInformationCompact;
