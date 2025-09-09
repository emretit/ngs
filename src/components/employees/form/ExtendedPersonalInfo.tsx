
import { PersonalInfoExtended } from "./sections/PersonalInfoExtended";
import { AddressInformation } from "./sections/AddressInformation";
import type { EmployeeFormData } from "./types";

interface ExtendedPersonalInfoProps {
  formData: EmployeeFormData;
  onFormChange: (field: keyof EmployeeFormData, value: string) => void;
  errors: Record<string, string>;
}

export const ExtendedPersonalInfo = ({ formData, onFormChange, errors }: ExtendedPersonalInfoProps) => {
  return (
    <>
      <PersonalInfoExtended 
        formData={formData}
        onFormChange={onFormChange}
        errors={errors}
      />
      
      <AddressInformation
        formData={formData}
        onFormChange={onFormChange}
        errors={errors}
      />
    </>
  );
};
