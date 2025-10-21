import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CustomerFormData } from "@/types/customer";
import { getDigitsOnly, formatPhoneNumber } from "@/utils/phoneFormatter";
import EmployeeSelector from "@/components/proposals/form/EmployeeSelector";

interface ContactInformationProps {
  formData: CustomerFormData;
  setFormData: (value: CustomerFormData) => void;
}

const ContactInformation = ({ formData, setFormData }: ContactInformationProps) => {
  return (
    <div className="space-y-3">
      {/* Müşteri Tipi ve Durumu */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="type" className="text-xs font-medium text-gray-700">Müşteri Tipi *</Label>
          <Select
            value={formData.type}
            onValueChange={(value: "bireysel" | "kurumsal") =>
              setFormData({ ...formData, type: value })
            }
          >
            <SelectTrigger id="type" className="h-7 text-xs">
              <SelectValue placeholder="Müşteri tipini seçiniz" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bireysel">👤 Bireysel</SelectItem>
              <SelectItem value="kurumsal">🏢 Kurumsal</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="status" className="text-xs font-medium text-gray-700">Müşteri Durumu *</Label>
          <Select
            value={formData.status}
            onValueChange={(value: "aktif" | "pasif" | "potansiyel") =>
              setFormData({ ...formData, status: value })
            }
          >
            <SelectTrigger id="status" className="h-7 text-xs">
              <SelectValue placeholder="Durum seçiniz" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="aktif">✅ Aktif</SelectItem>
              <SelectItem value="pasif">⏸️ Pasif</SelectItem>
              <SelectItem value="potansiyel">🎯 Potansiyel</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* İletişim Bilgileri */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
            className="h-7 text-xs"
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
            className="h-7 text-xs"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="website" className="text-xs font-medium text-gray-700">
            Website
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

        <div className="space-y-1.5">
          <EmployeeSelector
            value={formData.representative || ""}
            onChange={(value) => setFormData({ ...formData, representative: value })}
            placeholder="Temsilci seçiniz"
            label="Temsilci"
            showLabel={true}
          />
        </div>
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
      </div>
    </div>
  );
};

export default ContactInformation;
