import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import { SupplierFormData } from "@/types/supplier";
import { Printer, Globe } from "lucide-react";
import { getDigitsOnly, formatPhoneNumber } from "@/utils/phoneFormatter";

interface ContactInformationCompactProps {
  formData: SupplierFormData;
  setFormData: (value: SupplierFormData) => void;
}

const ContactInformationCompact = ({ formData, setFormData }: ContactInformationCompactProps) => {
  return (
    <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs font-medium text-gray-700">
            E-posta
          </Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="ornek@email.com"
            className="h-7 text-xs"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="mobile_phone" className="text-xs font-medium text-gray-700">
              Cep Telefonu
            </Label>
            <PhoneInput
              id="mobile_phone"
              value={formData.mobile_phone ? formatPhoneNumber(formData.mobile_phone) : ""}
              onChange={(value) => setFormData({ ...formData, mobile_phone: getDigitsOnly(value) })}
              className="h-7 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="office_phone" className="text-xs font-medium text-gray-700">
              Ofis Telefonu
            </Label>
            <PhoneInput
              id="office_phone"
              value={formData.office_phone ? formatPhoneNumber(formData.office_phone) : ""}
              onChange={(value) => setFormData({ ...formData, office_phone: getDigitsOnly(value) })}
              className="h-7 text-xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="fax" className="text-xs font-medium text-gray-700">
              Faks
            </Label>
            <PhoneInput
              id="fax"
              value={formData.fax ? formatPhoneNumber(formData.fax) : ""}
              onChange={(value) => setFormData({ ...formData, fax: getDigitsOnly(value) })}
              className="h-7 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="website" className="text-xs font-medium text-gray-700">
              Web Sitesi
            </Label>
            <Input
              id="website"
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              placeholder="https://www.example.com"
              className="h-7 text-xs"
            />
          </div>
        </div>
    </div>
  );
};

export default ContactInformationCompact;
