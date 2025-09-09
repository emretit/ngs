
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { EmployeeFormData } from "./types";

interface EmergencyContactInfoProps {
  formData: EmployeeFormData;
  onFormChange: (field: keyof EmployeeFormData, value: string) => void;
  errors: Record<string, string>;
}

export const EmergencyContactInfo = ({ formData, onFormChange, errors }: EmergencyContactInfoProps) => {
  return (
    <>
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Emergency Contact</h2>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="emergency_contact_name">Contact Name</Label>
          <Input
            id="emergency_contact_name"
            value={formData.emergency_contact_name || ""}
            onChange={(e) => onFormChange('emergency_contact_name', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="emergency_contact_relation">Relationship</Label>
          <Input
            id="emergency_contact_relation"
            value={formData.emergency_contact_relation || ""}
            onChange={(e) => onFormChange('emergency_contact_relation', e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2 mt-4">
        <Label htmlFor="emergency_contact_phone">Contact Phone</Label>
        <Input
          id="emergency_contact_phone"
          value={formData.emergency_contact_phone || ""}
          onChange={(e) => onFormChange('emergency_contact_phone', e.target.value)}
        />
      </div>
    </>
  );
};
