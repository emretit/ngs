import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "./useCurrentUser";

export const useDepartments = () => {
  const { userData } = useCurrentUser();

  return useQuery({
    queryKey: ['departments', userData?.company_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('departments')
        .select('name')
        
        .order('name');
      
      if (error) throw error;
      
      return data || [
        { name: "Engineering" },
        { name: "Sales" },
        { name: "Marketing" },
        { name: "Finance" },
        { name: "HR" },
        { name: "Operations" }
      ];
    },
    enabled: !!userData?.company_id,
    staleTime: 10 * 60 * 1000, // 10 minutes - departments rarely change
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
};
