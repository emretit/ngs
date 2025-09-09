
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface EmploymentDetailsProps {
  formData: {
    hire_date: string;
    department: string;
    position: string;
    status: string;
  };
  handleInputChange: (field: string, value: string) => void;
  departments: { name: string }[];
}

export const EmploymentDetails = ({ formData, handleInputChange, departments }: EmploymentDetailsProps) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold border-b pb-2">İstihdam Bilgileri</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="hire_date">İşe Başlama Tarihi</Label>
          <Input
            id="hire_date"
            type="date"
            value={formData.hire_date}
            onChange={(e) => handleInputChange("hire_date", e.target.value)}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="department">Departman</Label>
          <Select 
            value={formData.department} 
            onValueChange={(value) => handleInputChange("department", value)}
          >
            <SelectTrigger id="department">
              <SelectValue placeholder="Departman seçin" />
            </SelectTrigger>
            <SelectContent>
              {departments.map((dept) => (
                <SelectItem key={dept.name} value={dept.name}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="position">Pozisyon</Label>
          <Input
            id="position"
            value={formData.position}
            onChange={(e) => handleInputChange("position", e.target.value)}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="status">Çalışma Durumu</Label>
          <Select 
            value={formData.status} 
            onValueChange={(value) => handleInputChange("status", value)}
          >
            <SelectTrigger id="status">
              <SelectValue placeholder="Durum seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Aktif</SelectItem>
              <SelectItem value="on_leave">İzinli</SelectItem>
              <SelectItem value="resigned">İstifa Etmiş</SelectItem>
              <SelectItem value="terminated">İşten Çıkarılmış</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};
