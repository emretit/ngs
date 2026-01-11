
import { useQuery } from "@tanstack/react-query";
import { logger } from '@/utils/logger';
import { supabase } from "@/integrations/supabase/client";

export const useTechnicianNames = () => {
  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("employees")
          .select("id, first_name, last_name")
          .eq("is_technical", true)
          .eq("status", "aktif");
        
        if (error) throw error;
        return data || [];
      } catch (error) {
        logger.error("Error fetching technicians:", error);
        return [];
      }
    },
  });

  const getTechnicianName = (technicianId?: string) => {
    if (!technicianId || !employees) return "-";
    
    const employee = employees.find((e) => e.id === technicianId);
    return employee ? `${employee.first_name} ${employee.last_name}` : "-";
  };

  return { employees, getTechnicianName };
};
