
import { Card, CardContent } from "@/components/ui/card";
import { ExtendedPersonalInfo } from "../ExtendedPersonalInfo";
import { EmergencyContactInfo } from "../EmergencyContactInfo";
import { ImageUpload } from "../ImageUpload";
import type { EmployeeFormData } from "../types";

interface AdditionalInformationProps {
  formData: EmployeeFormData;
  onFormChange: (field: keyof EmployeeFormData, value: string) => void;
  errors: Record<string, string>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  selectedFile: File | null;
}

export const AdditionalInformation = ({
  formData,
  onFormChange,
  errors,
  onFileChange,
  selectedFile
}: AdditionalInformationProps) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <ExtendedPersonalInfo
            formData={formData}
            onFormChange={onFormChange}
            errors={errors}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <EmergencyContactInfo
            formData={formData}
            onFormChange={onFormChange}
            errors={errors}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Profile Image</h2>
          <ImageUpload
            onFileChange={onFileChange}
            selectedFile={selectedFile}
          />
        </CardContent>
      </Card>
    </div>
  );
};
