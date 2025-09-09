
import { useState } from "react";
import { initialFormData, type EmployeeFormData } from "../types";
import type { Employee } from "@/types/employee";
import { useFormValidation } from "../useFormValidation";
import { useImageUpload } from "../useImageUpload";

// Helper function to map Employee to form data
const mapEmployeeToFormData = (employee: Employee): EmployeeFormData => {
  return {
    first_name: employee.first_name,
    last_name: employee.last_name,
    email: employee.email,
    phone: employee.phone || '',
    position: employee.position,
    department: employee.department,
    hire_date: employee.hire_date,
    status: employee.status === 'aktif' ? 'active' : 'inactive', // Convert status
    avatar_url: employee.avatar_url || '',
    date_of_birth: employee.date_of_birth || '',
    gender: employee.gender || null,
    marital_status: employee.marital_status || null,
    address: employee.address || '',
    country: employee.country || 'Turkey',
    city: employee.city || '',
    district: employee.district || '',
    postal_code: employee.postal_code || '',
    id_ssn: employee.id_ssn || '',
    emergency_contact_name: employee.emergency_contact_name || '',
    emergency_contact_phone: employee.emergency_contact_phone || '',
    emergency_contact_relation: employee.emergency_contact_relation || '',
  };
};

export const useFormState = (initialData?: Employee, onSuccess?: () => void) => {
  const { validateForm } = useFormValidation();
  const { selectedFile, handleFileChange, uploadAvatar } = useImageUpload();
  
  const [formData, setFormData] = useState<EmployeeFormData>(
    initialData ? mapEmployeeToFormData(initialData) : initialFormData
  );
  const [isLoading, setIsLoading] = useState(false);
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

  return {
    formData,
    formErrors,
    isLoading,
    setIsLoading,
    handleFormChange,
    handleFileChange,
    selectedFile,
    uploadAvatar,
    setFormErrors,
    validateForm,
    isEditMode: !!initialData
  };
};
