
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CustomerFormData } from "@/types/customer";

interface CustomerTypeAndStatusProps {
  formData: CustomerFormData;
  setFormData: (value: CustomerFormData) => void;
}

const CustomerTypeAndStatus = ({ formData, setFormData }: CustomerTypeAndStatusProps) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      <div className="space-y-2">
        <Label htmlFor="type" className="text-sm font-medium text-muted-foreground">Müşteri Tipi *</Label>
        <Select
          value={formData.type}
          onValueChange={(value: "bireysel" | "kurumsal") =>
            setFormData({ ...formData, type: value })
          }
        >
          <SelectTrigger id="type">
            <SelectValue placeholder="Müşteri tipini seçiniz" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="bireysel">👤 Bireysel</SelectItem>
            <SelectItem value="kurumsal">🏢 Kurumsal</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="status" className="text-sm font-medium text-muted-foreground">Müşteri Durumu *</Label>
        <Select
          value={formData.status}
          onValueChange={(value: "aktif" | "pasif" | "potansiyel") =>
            setFormData({ ...formData, status: value })
          }
        >
          <SelectTrigger id="status">
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
  );
};

export default CustomerTypeAndStatus;
