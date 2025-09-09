
import React from "react";
import type { Employee } from "@/types/employee";
import { FormFields } from "../FormFields";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

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
  const [departments, setDepartments] = useState<{ name: string }[]>([]);

  // Fetch departments
  useEffect(() => {
    const fetchDepartments = async () => {
      const { data } = await supabase
        .from('departments')
        .select('name')
        .order('name');
      
      setDepartments(data || [
        { name: "Engineering" },
        { name: "Sales" },
        { name: "Marketing" },
        { name: "Finance" },
        { name: "HR" },
        { name: "Operations" }
      ]);
    };

    fetchDepartments();
  }, []);

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
