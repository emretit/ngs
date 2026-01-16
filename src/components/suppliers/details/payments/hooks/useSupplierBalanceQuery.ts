import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Supplier } from "@/types/supplier";

export const useSupplierBalanceQuery = (supplier: Supplier) => {
  return useQuery({
    queryKey: ['supplier', supplier.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('suppliers')
        .select('balance')
        .eq('id', supplier.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!supplier.id,
    initialData: { balance: supplier.balance },
  });
};
