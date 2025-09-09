
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PersonalInfoFieldsProps {
  formData: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
  handleInputChange: (field: string, value: string) => void;
}

export const PersonalInfoFields = ({ formData, handleInputChange }: PersonalInfoFieldsProps) => {
  return (
    <div className="col-span-2 space-y-4">
      <h4 className="text-sm font-semibold">Temel Bilgiler</h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="first_name">Ad</Label>
          <Input
            id="first_name"
            value={formData.first_name}
            onChange={(e) => handleInputChange("first_name", e.target.value)}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="last_name">Soyad</Label>
          <Input
            id="last_name"
            value={formData.last_name}
            onChange={(e) => handleInputChange("last_name", e.target.value)}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email">E-posta</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="phone">Telefon</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => handleInputChange("phone", e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};
