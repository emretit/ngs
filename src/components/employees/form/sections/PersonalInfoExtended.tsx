
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import type { EmployeeFormData } from "../types";
import { GENDERS, MARITAL_STATUS } from "../types";

interface PersonalInfoExtendedProps {
  formData: EmployeeFormData;
  onFormChange: (field: keyof EmployeeFormData, value: string) => void;
  errors: Record<string, string>;
}

export const PersonalInfoExtended = ({ formData, onFormChange, errors }: PersonalInfoExtendedProps) => {
  return (
    <>
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Extended Personal Information</h2>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date_of_birth">Date of Birth</Label>
          <Input
            id="date_of_birth"
            type="date"
            value={formData.date_of_birth || ""}
            onChange={(e) => onFormChange('date_of_birth', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="id_ssn">ID/SSN</Label>
          <Input
            id="id_ssn"
            value={formData.id_ssn || ""}
            onChange={(e) => onFormChange('id_ssn', e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="space-y-2">
          <Label htmlFor="gender">Gender</Label>
          <Select
            value={formData.gender || ""}
            onValueChange={(value) => onFormChange('gender', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              {GENDERS.map((gender) => (
                <SelectItem key={gender} value={gender}>
                  {gender}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="marital_status">Marital Status</Label>
          <Select
            value={formData.marital_status || ""}
            onValueChange={(value) => onFormChange('marital_status', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select marital status" />
            </SelectTrigger>
            <SelectContent>
              {MARITAL_STATUS.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </>
  );
};
