
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { Employee } from "../../../types";

interface EmergencyContactFieldsProps {
  formData: Partial<Employee>;
  handleInputChange?: (field: string, value: string) => void;
  isEditing?: boolean;
}

export const EmergencyContactFields = ({
  formData,
  handleInputChange,
  isEditing = false
}: EmergencyContactFieldsProps) => {
  return (
    <>
      <h4 className="text-lg font-medium text-gray-700 mt-8 mb-4">Acil Durum İletişim Bilgileri</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="emergency_contact_name">İletişim Kişisi</Label>
          {isEditing ? (
            <Input
              id="emergency_contact_name"
              value={formData.emergency_contact_name || ''}
              onChange={(e) => handleInputChange?.('emergency_contact_name', e.target.value)}
            />
          ) : (
            <div className="p-2 bg-gray-50 rounded-md">{formData.emergency_contact_name || '-'}</div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="emergency_contact_relation">Yakınlık Derecesi</Label>
          {isEditing ? (
            <Input
              id="emergency_contact_relation"
              value={formData.emergency_contact_relation || ''}
              onChange={(e) => handleInputChange?.('emergency_contact_relation', e.target.value)}
            />
          ) : (
            <div className="p-2 bg-gray-50 rounded-md">{formData.emergency_contact_relation || '-'}</div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="emergency_contact_phone">Telefon</Label>
          {isEditing ? (
            <Input
              id="emergency_contact_phone"
              value={formData.emergency_contact_phone || ''}
              onChange={(e) => handleInputChange?.('emergency_contact_phone', e.target.value)}
            />
          ) : (
            <div className="p-2 bg-gray-50 rounded-md">{formData.emergency_contact_phone || '-'}</div>
          )}
        </div>
      </div>
    </>
  );
};
