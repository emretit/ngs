
import { Card, CardContent } from "@/components/ui/card";
import { PersonalInfo } from "../PersonalInfo";
import { RoleInfo } from "../RoleInfo";
import { StatusInfo } from "../StatusInfo";
import type { EmployeeFormData } from "../types";
import type { Department } from "../types";

interface BasicInformationProps {
  formData: EmployeeFormData;
  departments: Department[];
  onFormChange: (field: keyof EmployeeFormData, value: string) => void;
  errors: Record<string, string>;
  isEditMode: boolean;
}

export const BasicInformation = ({
  formData,
  departments,
  onFormChange,
  errors,
  isEditMode
}: BasicInformationProps) => {
  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Basic Information</h2>
        
        <PersonalInfo
          formData={formData}
          onFormChange={onFormChange}
          errors={errors}
          isEditMode={isEditMode}
        />

        <RoleInfo
          formData={formData}
          departments={departments}
          onFormChange={onFormChange}
          errors={errors}
        />

        <StatusInfo
          formData={formData}
          onFormChange={onFormChange}
          errors={errors}
        />
      </CardContent>
    </Card>
  );
};
