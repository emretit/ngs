import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toastUtils";
import { EmployeeFormValues } from "./useEmployeeForm";

export const useEmployeeSubmit = (employeeId?: string) => {
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (
    values: EmployeeFormValues,
    onSuccess?: () => void
  ) => {
    try {
      setIsSaving(true);

      const { error } = await supabase
        .from("employees")
        .update(values)
        .eq("id", employeeId);

      if (error) throw error;

      showSuccess("Çalışan bilgileri başarıyla güncellendi");
      onSuccess?.();
    } catch (error) {
      console.error("Çalışan güncellenirken hata:", error);
      showError("Çalışan bilgileri güncellenirken bir hata oluştu");
    } finally {
      setIsSaving(false);
    }
  };

  return {
    isSaving,
    handleSubmit,
  };
};
