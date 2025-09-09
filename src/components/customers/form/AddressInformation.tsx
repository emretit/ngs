import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CustomerFormData } from "@/types/customer";
import { MapPin } from "lucide-react";

interface AddressInformationProps {
  formData: CustomerFormData;
  setFormData: (value: CustomerFormData) => void;
}

const AddressInformation = ({ formData, setFormData }: AddressInformationProps) => {
  return (
    <div className="space-y-4">
      {/* Adres Bilgileri */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
          <div className="w-0.5 h-3 bg-rose-500 rounded-full"></div>
          Adres Bilgileri
        </h3>
        
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="country" className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3 text-rose-500" />
                <span>Ülke</span>
              </Label>
              <Input
                id="country"
                value="Türkiye"
                placeholder="Ülke seçiniz"
                readOnly
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city" className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3 text-rose-600" />
                <span>İl</span>
              </Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="İl seçiniz"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="district" className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3 text-rose-700" />
                <span>İlçe</span>
              </Label>
              <Input
                id="district"
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                placeholder="İlçe seçiniz"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="address" className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <MapPin className="w-3 h-3 text-rose-500" />
              <span>Detaylı Adres</span>
            </Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Mahalle, sokak, bina no, daire no vb."
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddressInformation;
