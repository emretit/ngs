
import { useState } from "react";
import { logger } from '@/utils/logger';
import { Employee } from "@/types/employee";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toastUtils";

interface UseEditableEmployeeFormProps {
  employee: Employee;
  onSuccess?: () => void;
}

export const useEditableEmployeeForm = ({ employee, onSuccess }: UseEditableEmployeeFormProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleSave = async (updatedEmployee: Partial<Employee>) => {
    try {
      setIsSaving(true);

      // Create a copy of the employee to avoid modifying the original
      const employeeToUpdate = { ...updatedEmployee };
      
      // Normalize status to match database expectations if needed
      if (employeeToUpdate.status) {
        // Handle any status conversion if necessary in the future
        // No conversion needed now as we standardized on 'aktif'/'pasif'
      }

      const { error } = await supabase
        .from('employees')
        .update(employeeToUpdate as any)
        .eq('id', employee.id);

      if (error) throw error;

      showSuccess("Çalışan bilgileri başarıyla güncellendi", { duration: 1000 });

      setIsEditing(false);
      onSuccess?.();
    } catch (error) {
      logger.error('Çalışan güncellenirken hata:', error);
      showError("Çalışan bilgileri güncellenirken bir hata oluştu");
    } finally {
      setIsSaving(false);
    }
  };

  return {
    isEditing,
    isSaving,
    handleEdit,
    handleCancel,
    handleSave,
  };
};
