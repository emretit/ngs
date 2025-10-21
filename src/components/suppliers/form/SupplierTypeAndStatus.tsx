import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SupplierFormData } from "@/types/supplier";
import { Building, FileText } from "lucide-react";

interface SupplierTypeAndStatusProps {
  formData: SupplierFormData;
  setFormData: (value: SupplierFormData) => void;
}

const SupplierTypeAndStatus = ({ formData, setFormData }: SupplierTypeAndStatusProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-0.5 h-3 bg-green-600 rounded-full"></div>
        <span className="text-sm font-medium text-green-800">Tedarikçi Tipi ve Durumu</span>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="type" className="text-sm font-medium text-muted-foreground flex items-center gap-1">
            <Building className="w-3 h-3 text-amber-500" />
            <span>Tedarikçi Türü</span>
          </Label>
          <Select
            value={formData.type}
            onValueChange={(value: "bireysel" | "kurumsal") =>
              setFormData({ ...formData, type: value })
            }
          >
            <SelectTrigger className="h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bireysel">Bireysel</SelectItem>
              <SelectItem value="kurumsal">Kurumsal</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status" className="text-sm font-medium text-muted-foreground flex items-center gap-1">
            <FileText className="w-3 h-3 text-emerald-500" />
            <span>Durum</span>
          </Label>
          <Select
            value={formData.status}
            onValueChange={(value: "aktif" | "pasif" | "potansiyel") =>
              setFormData({ ...formData, status: value })
            }
          >
            <SelectTrigger className="h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="aktif">Aktif</SelectItem>
              <SelectItem value="pasif">Pasif</SelectItem>
              <SelectItem value="potansiyel">Potansiyel</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default SupplierTypeAndStatus;
