import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Customer } from "@/types/customer";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export const useSalesInvoicesQuery = (customer: Customer) => {
  const { userData, loading: userLoading } = useCurrentUser();

  return useQuery({
    queryKey: ['customer-sales-invoices', customer.id, userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) {
        console.warn('No company_id available for sales invoices');
        return [];
      }

      const { data, error } = await supabase
        .from('sales_invoices')
        .select('*')
        .eq('customer_id', customer.id)
        .eq('company_id', userData.company_id)
        .order('fatura_tarihi', { ascending: false });

      if (error) {
        console.error('Error fetching sales invoices:', error);
        throw error;
      }
      return data || [];
    },
    enabled: !!customer.id && !!userData?.company_id && !userLoading,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
};

