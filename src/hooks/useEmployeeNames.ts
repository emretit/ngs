
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useEmployeeNames = () => {
  const { data: employees = [], isLoading } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("employees")
          .select("id, first_name, last_name");
        
        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error("Error fetching employees:", error);
        return [];
      }
    },
  });

  const getEmployeeName = (employeeId?: string) => {
    if (!employeeId || !employees) return "-";
    
    const employee = employees.find((e) => e.id === employeeId);
    return employee ? `${employee.first_name} ${employee.last_name}` : "-";
  };

  return { employees, getEmployeeName, isLoading };
};
