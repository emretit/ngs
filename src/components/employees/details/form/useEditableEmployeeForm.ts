
import { useState } from "react";
import { Employee } from "@/types/employee";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface UseEditableEmployeeFormProps {
  employee: Employee;
  onSuccess?: () => void;
}

export const useEditableEmployeeForm = ({ employee, onSuccess }: UseEditableEmployeeFormProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
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
          status: updatedEmployee.status === 'aktif' || updatedEmployee.status === 'active' 
            ? 'aktif' 
            : 'pasif',
        })
        .eq('id', employee.id);

      if (error) throw error;

      // Invalidate both queries
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employee', employee.id] });

      toast({
        title: "Başarılı",
        description: "Çalışan bilgileri başarıyla güncellendi",
      });

      setIsEditing(false);
      onSuccess?.();
    } catch (error) {
      console.error('Çalışan güncellenirken hata:', error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Çalışan bilgileri güncellenirken bir hata oluştu",
      });
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
