
import { BasicInfoFields } from "./sections/BasicInfoFields";
import { PersonalInfoFields } from "./sections/PersonalInfoFields";
import { AddressFields } from "./sections/AddressFields";
import { EmergencyContactFields } from "./sections/EmergencyContactFields";
import type { Employee } from "../../types";

interface FormFieldsProps {
  formData: Partial<Employee>;
  departments: { name: string }[];
  handleInputChange?: (field: string, value: string) => void;
  isEditing?: boolean;
}

export const FormFields = ({ 
  formData, 
  departments, 
  handleInputChange, 
  isEditing = false
}: FormFieldsProps) => {
  return (
    <div className="space-y-8">
      <BasicInfoFields
        formData={formData}
        departments={departments}
        handleInputChange={handleInputChange}
        isEditing={isEditing}
      />
      
      <PersonalInfoFields
        formData={formData}
        handleInputChange={handleInputChange}
        isEditing={isEditing}
      />
      
      <AddressFields
        formData={formData}
        handleInputChange={handleInputChange}
        isEditing={isEditing}
      />
      
      <EmergencyContactFields
        formData={formData}
        handleInputChange={handleInputChange}
        isEditing={isEditing}
      />
    </div>
  );
};
