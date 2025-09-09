import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Employee } from "@/types/employee";
import { EmployeeFormWrapper } from "./form/EmployeeFormWrapper";

interface EmployeeFormProps {
  employee?: Employee;
  isLoading?: boolean;
}

const EmployeeForm = ({ employee, isLoading = false }: EmployeeFormProps) => {
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();

  const handleFormSubmit = async (formData: Partial<Employee>) => {
    setIsSaving(true);
    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log("Form submitted with data:", formData);
    setIsSaving(false);
  };

  return (
    <EmployeeFormWrapper
      employee={employee}
      isLoading={isLoading}
      isSaving={isSaving}
      isEditMode={!!employee}
      handleFormSubmit={handleFormSubmit}
      onSuccess={() => navigate("/employees")}
    />
  );
};

export default EmployeeForm;
