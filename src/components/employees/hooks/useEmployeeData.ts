
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Employee } from "@/types/employee";
import { showSuccess, showError } from "@/utils/toastUtils";
import { useAuth } from "@/hooks/useAuth";

export const useEmployeeData = () => {
  const { user, session } = useAuth();
  
  const { data: employees = [], isLoading, refetch } = useQuery({
    queryKey: ['employees', user?.id],
    queryFn: async () => {
      if (!session) {
        console.log('No session available for employees query');
        return [];
      }

      try {
        console.log('Fetching employees with session:', session.user.id);
        
        const { data, error } = await supabase
          .from('employees')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (error) {
          console.error('Supabase error:', error);
          throw error;
        }
        
        console.log('Employees fetched successfully:', data?.length || 0);
        return data as Employee[];
      } catch (error) {
        console.error('Error fetching employees:', error);
        showError("Çalışan bilgileri yüklenirken bir hata oluştu.");
        return [];
      }
    },
    enabled: !!session,
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
