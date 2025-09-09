
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { EmployeeFormData } from "./types";

interface PersonalInfoProps {
  formData: EmployeeFormData;
  onFormChange: (field: keyof EmployeeFormData, value: string) => void;
  errors: Record<string, string>;
  isEditMode: boolean;
}

export const PersonalInfo = ({ formData, onFormChange, errors, isEditMode }: PersonalInfoProps) => {
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="first_name">First Name *</Label>
          <Input
            id="first_name"
            value={formData.first_name}
            onChange={(e) => onFormChange('first_name', e.target.value)}
            className={errors.first_name ? "border-red-500" : ""}
            required
          />
          {errors.first_name && (
            <p className="text-sm text-red-500">{errors.first_name}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="last_name">Last Name *</Label>
          <Input
            id="last_name"
            value={formData.last_name}
            onChange={(e) => onFormChange('last_name', e.target.value)}
            className={errors.last_name ? "border-red-500" : ""}
            required
          />
          {errors.last_name && (
            <p className="text-sm text-red-500">{errors.last_name}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => onFormChange('email', e.target.value)}
          className={errors.email ? "border-red-500" : ""}
          required
          readOnly={isEditMode}
        />
        {errors.email && (
          <p className="text-sm text-red-500">{errors.email}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          value={formData.phone}
          onChange={(e) => onFormChange('phone', e.target.value)}
          className={errors.phone ? "border-red-500" : ""}
          placeholder="+1 234 567 8900"
        />
        {errors.phone && (
          <p className="text-sm text-red-500">{errors.phone}</p>
        )}
      </div>
    </>
  );
};
