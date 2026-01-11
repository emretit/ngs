
import { useState } from "react";
import { logger } from '@/utils/logger';
import { Employee } from "@/types/employee";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface UseEditableEmployeeFormProps {
  employee: Employee;
  onSuccess?: () => void;
}

export const useEditableEmployeeForm = ({ employee, onSuccess }: UseEditableEmployeeFormProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const queryClient = useQueryClient();

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleSave = async (updatedEmployee: Partial<Employee>) => {
    try {
      setIsSaving(true);

      const { error } = await supabase
        .from('employees')
        .update({
          ...updatedEmployee,
          // Ensure we're saving the correct status format to DB
          status: updatedEmployee.status === 'aktif' || String(updatedEmployee.status) === 'active' 
            ? 'aktif' 
            : 'pasif',
        })
        .eq('id', employee.id);

      if (error) throw error;

      // Invalidate both queries
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employee', employee.id] });

      toast.success("Çalışan bilgileri başarıyla güncellendi");

      setIsEditing(false);
      onSuccess?.();
    } catch (error) {
      logger.error('Çalışan güncellenirken hata:', error);
      toast.error("Çalışan bilgileri güncellenirken bir hata oluştu");
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
