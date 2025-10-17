import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toastUtils";
import { EmployeeFormValues } from "./useEmployeeForm";

// Helper functions to convert Turkish values back to English for database
const salaryTypeToEnglish = (type: string | null | undefined): string | null => {
  if (!type) return null;
  const mapping: Record<string, string> = {
    "brüt": "gross",
    "net": "net",
    "saatlik": "hourly",
    "günlük": "daily"
  };
  return mapping[type] || null;
};

const paymentFrequencyToEnglish = (freq: string | null | undefined): string | null => {
  if (!freq) return null;
  const mapping: Record<string, string> = {
    "aylık": "monthly",
    "haftalık": "weekly",
    "günlük": "daily",
    "saatlik": "hourly"
  };
  return mapping[freq] || null;
};

const sanitizeEmployeeValues = (input: any) => {
  const dateFields = ['hire_date','date_of_birth','salary_start_date','effective_date'];
  const sanitized: any = { ...input };

  // Normalize empty strings for known date fields to null
  dateFields.forEach((field) => {
    if (sanitized[field] === '' || sanitized[field] === undefined) {
      sanitized[field] = null;
    }
  });

  // Also convert any other empty string values to null to avoid type errors
  Object.keys(sanitized).forEach((k) => {
    if (sanitized[k] === '') sanitized[k] = null;
  });

  return sanitized;
};

export const useEmployeeSubmit = (employeeId?: string) => {
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (
    values: EmployeeFormValues,
    onSuccess?: () => void
  ) => {
    try {
      setIsSaving(true);

      // Convert Turkish values to English for database and sanitize empty inputs
      const dbValues = sanitizeEmployeeValues({
        ...values,
        salary_type: salaryTypeToEnglish(values.salary_type),
        payment_frequency: paymentFrequencyToEnglish(values.payment_frequency),
      });

      const { error } = await supabase
        .from("employees")
        .update(dbValues)
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
