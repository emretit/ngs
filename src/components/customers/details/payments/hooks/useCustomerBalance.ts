import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Customer } from "@/types/customer";

export const useCustomerBalance = (customer: Customer) => {
  const { data: currentCustomer } = useQuery({
    queryKey: ['customer', customer.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('balance')
        .eq('id', customer.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!customer.id,
    initialData: { balance: customer.balance },
  });

  return currentCustomer?.balance ?? customer.balance ?? 0;
};

