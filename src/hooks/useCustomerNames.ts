
import { useQuery } from "@tanstack/react-query";
import { logger } from '@/utils/logger';
import { supabase } from "@/integrations/supabase/client";

interface Customer {
  id: string;
  name: string;
  company?: string;
}

export const useCustomerNames = () => {
  const { data: customers = [], isLoading, error } = useQuery({
    queryKey: ["customer-names"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("customers")
          .select("id, name, company")
          .order("name");
          
        if (error) throw error;
        
        return data as Customer[];
      } catch (error) {
        logger.error("Error loading customers:", error);
        throw error;
      }
    }
  });
  
  const getCustomerName = (customerId?: string) => {
    if (!customerId || !customers) return "-";
    const customer = customers.find(c => c.id === customerId);
    return customer ? customer.name : "-";
  };
  
  return {
    customers,
    isLoading,
    error,
    getCustomerName
  };
};
