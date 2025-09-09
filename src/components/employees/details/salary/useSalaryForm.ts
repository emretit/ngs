
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toastUtils";

export const useSalaryForm = (employeeId: string) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const saveSalary = async (values: any) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('employee_salaries')
        .insert({
          employee_id: employeeId,
          amount: values.base_salary,
          currency: 'TRY',
          effective_date: values.effective_date,
          payment_date: values.payment_date,
          gross_salary: values.base_salary + values.allowances + values.bonuses,
          net_salary: values.base_salary + values.allowances + values.bonuses - values.deductions,
          notes: values.notes,
          allowances: {
            allowances: values.allowances,
            bonuses: values.bonuses,
            deductions: values.deductions
          }
        });

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
