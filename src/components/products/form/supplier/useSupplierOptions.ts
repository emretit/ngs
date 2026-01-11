
import { useQuery } from "@tanstack/react-query";
import { logger } from '@/utils/logger';
import { supabase } from "@/integrations/supabase/client";

/**
 * Custom hook to fetch supplier options for product forms
 */
export const useSupplierOptions = () => {
  return useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("suppliers")
        .select("id, name")
        .order("name");
      
      if (error) {
        logger.error("Error fetching suppliers:", error);
        return [];
      }
      return data || [];
    },
  });
};
