
import React from "react";
import type { Employee } from "@/types/employee";
import { FormFields } from "../FormFields";
import { useState } from "react";
import { useDepartments } from "@/hooks/useDepartments";

interface EmployeeFormProps {
  employee: Employee;
  isEditing: boolean;
  isSaving: boolean;
  onSave: (data: Partial<Employee>) => void;
  onCancel: () => void;
}

export const EmployeeForm = ({ 
  employee, 
  isEditing,
  isSaving,
  onSave,
  onCancel
}: EmployeeFormProps) => {
  const [formData, setFormData] = useState<Partial<Employee>>(employee);
  const { data: departments = [] } = useDepartments();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    onSave(formData);
  };

  return (
    <div className="space-y-6">
      <FormFields 
        formData={formData}
        departments={departments}
        handleInputChange={handleInputChange}
        isEditing={isEditing}
      />
    </div>
  );
};
