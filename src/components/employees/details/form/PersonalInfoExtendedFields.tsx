
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PersonalInfoExtendedFieldsProps {
  formData: {
    date_of_birth?: string;
    gender?: string;
    marital_status?: string;
    address?: string;
    city?: string;
    postal_code?: string;
    id_ssn?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    emergency_contact_relation?: string;
  };
  handleInputChange: (field: string, value: string) => void;
}

export const PersonalInfoExtendedFields = ({ formData, handleInputChange }: PersonalInfoExtendedFieldsProps) => {
  return (
    <div className="col-span-2 space-y-4">
      <h4 className="text-sm font-semibold">Kişisel Bilgiler</h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date_of_birth">Doğum Tarihi</Label>
          <Input
            id="date_of_birth"
            type="date"
            value={formData.date_of_birth || ""}
            onChange={(e) => handleInputChange("date_of_birth", e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="gender">Cinsiyet</Label>
          <Select 
            value={formData.gender || ""} 
            onValueChange={(value) => handleInputChange("gender", value)}
          >
            <SelectTrigger id="gender">
              <SelectValue placeholder="Seçiniz" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Erkek</SelectItem>
              <SelectItem value="female">Kadın</SelectItem>
              <SelectItem value="other">Diğer</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="marital_status">Medeni Durum</Label>
          <Select 
            value={formData.marital_status || ""} 
            onValueChange={(value) => handleInputChange("marital_status", value)}
          >
            <SelectTrigger id="marital_status">
              <SelectValue placeholder="Seçiniz" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="single">Bekar</SelectItem>
              <SelectItem value="married">Evli</SelectItem>
              <SelectItem value="divorced">Boşanmış</SelectItem>
              <SelectItem value="widowed">Dul</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="id_ssn">TC Kimlik No / Pasaport No</Label>
          <Input
            id="id_ssn"
            value={formData.id_ssn || ""}
            onChange={(e) => handleInputChange("id_ssn", e.target.value)}
          />
        </div>
      </div>
      
      <h4 className="text-sm font-semibold pt-2">Adres Bilgileri</h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="address">Adres</Label>
          <Input
            id="address"
            value={formData.address || ""}
            onChange={(e) => handleInputChange("address", e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="city">Şehir</Label>
          <Input
            id="city"
            value={formData.city || ""}
            onChange={(e) => handleInputChange("city", e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="postal_code">Posta Kodu</Label>
          <Input
            id="postal_code"
            value={formData.postal_code || ""}
            onChange={(e) => handleInputChange("postal_code", e.target.value)}
          />
        </div>
      </div>
      
      <h4 className="text-sm font-semibold pt-2">Acil Durumda Aranacak Kişi</h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="emergency_contact_name">Ad Soyad</Label>
          <Input
            id="emergency_contact_name"
            value={formData.emergency_contact_name || ""}
            onChange={(e) => handleInputChange("emergency_contact_name", e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="emergency_contact_phone">Telefon</Label>
          <Input
            id="emergency_contact_phone"
            value={formData.emergency_contact_phone || ""}
            onChange={(e) => handleInputChange("emergency_contact_phone", e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="emergency_contact_relation">Yakınlık Derecesi</Label>
          <Input
            id="emergency_contact_relation"
            value={formData.emergency_contact_relation || ""}
            onChange={(e) => handleInputChange("emergency_contact_relation", e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};
