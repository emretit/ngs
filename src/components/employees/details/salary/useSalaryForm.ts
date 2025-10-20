
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toastUtils";

export const useSalaryForm = (employeeId: string) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const saveSalary = async (values: any) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('employees')
        .update({
          net_salary: values.base_salary + values.allowances + values.bonuses - values.deductions,
          gross_salary: values.base_salary + values.allowances + values.bonuses,
          meal_allowance: values.allowances || 0,
          transport_allowance: values.bonuses || 0,
          manual_employer_sgk_cost: values.deductions || 0,
          total_employer_cost: values.base_salary + values.allowances + values.bonuses + (values.deductions || 0),
          salary_notes: values.notes,
          effective_date: values.effective_date,
        })
        .eq('id', employeeId);

      if (error) throw error;

      showSuccess("Maaş bilgisi başarıyla kaydedildi");
      
      return true;
    } catch (error) {
      console.error('Maaş bilgisi kaydedilirken hata:', error);
      showError("Maaş bilgisi kaydedilirken bir hata oluştu");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    saveSalary
  };
};
