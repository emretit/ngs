
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { EmployeeFormData } from "./types";

interface StatusInfoProps {
  formData: EmployeeFormData;
  onFormChange: (field: keyof EmployeeFormData, value: string) => void;
  errors: Record<string, string>;
}

export const StatusInfo = ({ formData, onFormChange, errors }: StatusInfoProps) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="hire_date">Start Date *</Label>
        <Input
          id="hire_date"
          type="date"
          value={formData.hire_date}
          onChange={(e) => onFormChange('hire_date', e.target.value)}
          className={errors.hire_date ? "border-red-500" : ""}
          required
        />
        {errors.hire_date && (
          <p className="text-sm text-red-500">{errors.hire_date}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status *</Label>
        <Select
          value={formData.status}
          onValueChange={(value: 'active' | 'inactive') => onFormChange('status', value)}
        >
          <SelectTrigger className={errors.status ? "border-red-500" : ""}>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        {errors.status && (
          <p className="text-sm text-red-500">{errors.status}</p>
        )}
      </div>
    </div>
  );
};
