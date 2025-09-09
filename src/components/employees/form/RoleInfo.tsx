
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Department, EmployeeFormData, Position } from "./types";

interface RoleInfoProps {
  formData: EmployeeFormData;
  departments: Department[];
  onFormChange: (field: keyof EmployeeFormData, value: string) => void;
  errors: Record<string, string>;
}

export const RoleInfo = ({ formData, departments, onFormChange, errors }: RoleInfoProps) => {
  // Define available positions
  const POSITIONS: Position[] = [
    "Manager", 
    "Sales Representative", 
    "Marketing Specialist", 
    "Developer", 
    "Designer", 
    "HR Specialist", 
    "Customer Support", 
    "Admin", 
    "Director", 
    "Technician"
  ];

  const shouldShowDepartment = formData.position !== 'Admin';

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="position">Role *</Label>
        <Select
          value={formData.position}
          onValueChange={(value) => {
            onFormChange('position', value);
            if (value === 'Admin') {
              onFormChange('department', '');
            }
          }}
        >
          <SelectTrigger className={errors.position ? "border-red-500" : ""}>
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent>
            {POSITIONS.map((position) => (
              <SelectItem key={position} value={position}>
                {position}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.position && (
          <p className="text-sm text-red-500">{errors.position}</p>
        )}
      </div>

      {shouldShowDepartment && (
        <div className="space-y-2">
          <Label htmlFor="department">Department *</Label>
          <Select
            value={formData.department}
            onValueChange={(value) => onFormChange('department', value)}
          >
            <SelectTrigger className={errors.department ? "border-red-500" : ""}>
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent>
              {departments.map((department) => (
                <SelectItem key={department.id} value={department.name}>
                  {department.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.department && (
            <p className="text-sm text-red-500">{errors.department}</p>
          )}
        </div>
      )}
    </div>
  );
};
