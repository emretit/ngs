
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { PersonalInfo } from "./PersonalInfo";
import { RoleInfo } from "./RoleInfo";
import { FormActions } from "./FormActions";
import { StatusInfo } from "./StatusInfo";
import { Employee } from "@/types/employee";
import { EmployeeFormData } from "./types";

interface EmployeeFormWrapperProps {
  employee: Employee;
  isLoading: boolean;
  isSaving: boolean;
  isEditMode: boolean;
  handleFormSubmit: (formData: Partial<Employee>) => Promise<void>;
  onSuccess?: () => void;
}

export const EmployeeFormWrapper: React.FC<EmployeeFormWrapperProps> = ({
  employee,
  isLoading,
  isSaving,
  isEditMode,
  handleFormSubmit,
  onSuccess
}) => {
  // Convert Employee to EmployeeFormData to ensure required fields are present
  const initialFormData: EmployeeFormData = {
    first_name: employee.first_name,
    last_name: employee.last_name,
    email: employee.email,
    phone: employee.phone || "",
    position: employee.position,
    department: employee.department,
    hire_date: employee.hire_date,
    status: employee.status === 'aktif' ? 'active' : 'inactive', // Convert status
    avatar_url: employee.avatar_url || "",
    date_of_birth: employee.date_of_birth || "",
    gender: (employee.gender === "erkek" ? "male" : employee.gender === "kadın" ? "female" : employee.gender === "diğer" ? "other" : null) as "male" | "female" | "other" | null,
    marital_status: (employee.marital_status === "bekar" ? "single" : employee.marital_status === "evli" ? "married" : employee.marital_status === "boşanmış" ? "divorced" : employee.marital_status === "dul" ? "widowed" : null) as "single" | "married" | "divorced" | "widowed" | null,
    address: employee.address || "",
    country: employee.country || "Turkey",
    city: employee.city || "",
    district: employee.district || "",
    postal_code: employee.postal_code || "",
    id_ssn: employee.id_ssn || "",
    emergency_contact_name: employee.emergency_contact_name || "",
    emergency_contact_phone: employee.emergency_contact_phone || "",
    emergency_contact_relation: employee.emergency_contact_relation || ""
  };
  
  const [formData, setFormData] = useState<EmployeeFormData>(initialFormData);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  const handleFormChange = (field: keyof EmployeeFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };
  
  const handleFileChange = (file: File | null) => {
    setSelectedFile(file);
  };
  
  const handleSubmit = async () => {
    // Convert EmployeeFormData back to Partial<Employee> for submission
    const employeeData: Partial<Employee> = {
      ...formData,
      status: formData.status === 'active' ? 'aktif' : 'pasif', // Convert back to DB format
      // Convert gender back to Turkish
      gender: formData.gender === "male" ? "erkek" : formData.gender === "female" ? "kadın" : formData.gender === "other" ? "diğer" : null,
      // Convert marital_status back to Turkish
      marital_status: formData.marital_status === "single" ? "bekar" : formData.marital_status === "married" ? "evli" : formData.marital_status === "divorced" ? "boşanmış" : formData.marital_status === "widowed" ? "dul" : null
    };
    
    await handleFormSubmit(employeeData);
    if (onSuccess) onSuccess();
  };
  
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-8">
          <PersonalInfo
            formData={formData}
            onFormChange={handleFormChange}
            errors={formErrors}
            isEditMode={isEditMode}
          />
          
          <RoleInfo
            formData={formData}
            departments={[
              { id: "1", name: "Sales" },
              { id: "2", name: "Marketing" },
              { id: "3", name: "HR" },
              { id: "4", name: "Development" },
              { id: "5", name: "Support" },
            ]}
            onFormChange={handleFormChange}
            errors={formErrors}
          />
          
          <StatusInfo
            formData={formData}
            onFormChange={handleFormChange}
            errors={formErrors}
          />
          
          <FormActions
            isEditMode={isEditMode}
            isSaving={isSaving}
            onSave={handleSubmit}
          />
        </div>
      </CardContent>
    </Card>
  );
};
