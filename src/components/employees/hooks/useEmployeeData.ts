
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Employee } from "@/types/employee";
import { showSuccess, showError } from "@/utils/toastUtils";

export const useEmployeeData = () => {
  const { data: employees = [], isLoading, refetch } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('employees')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        return data as Employee[];
      } catch (error) {
        console.error('Error fetching employees:', error);
        showError("Çalışan bilgileri yüklenirken bir hata oluştu.");
        return [];
      }
    },
  });

  const handleClearEmployees = async () => {
    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
        
      if (error) throw error;
      
      showSuccess("Tüm çalışan bilgileri silindi.");
      
      refetch();
    } catch (error) {
      console.error('Error clearing employees:', error);
      showError("Çalışan bilgileri silinirken bir hata oluştu.");
    }
  };

  return {
    employees,
    isLoading,
    refetch,
    handleClearEmployees
  };
};
