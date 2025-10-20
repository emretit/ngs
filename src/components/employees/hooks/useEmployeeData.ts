
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Employee } from "@/types/employee";
import { showSuccess, showError } from "@/utils/toastUtils";
import { useAuth } from "@/hooks/useAuth";
import { logger } from "@/utils/logger";

export const useEmployeeData = () => {
  const { user, session } = useAuth();
  
  const { data: employees = [], isLoading, refetch } = useQuery({
    queryKey: ['employees', user?.id],
    queryFn: async () => {
      if (!session) {
        logger.info('No session available for employees query');
        return [];
      }

      try {
        logger.info('Fetching employees', { userId: session.user.id });
        
        const { data, error } = await supabase
          .from('employees')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (error) {
          throw error;
        }
        
        logger.info('Employees fetched successfully', { count: data?.length || 0 });
        return data as Employee[];
      } catch (error) {
        logger.error('Error fetching employees', error);
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
      
      showSuccess("Tüm çalışan bilgileri silindi.", { duration: 1000 });
      
      refetch();
    } catch (error) {
      logger.error('Error clearing employees', error);
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
