import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ManagerChainItem } from "@/types/approval";

export const useManagerChain = (employeeId: string | null | undefined) => {
  return useQuery({
    queryKey: ["manager-chain", employeeId],
    queryFn: async () => {
      if (!employeeId) return [];

      const { data, error } = await supabase.rpc("get_manager_chain", {
        p_employee_id: employeeId,
        p_max_levels: 10,
      });

      if (error) throw error;
      return data as ManagerChainItem[];
    },
    enabled: !!employeeId,
  });
};

