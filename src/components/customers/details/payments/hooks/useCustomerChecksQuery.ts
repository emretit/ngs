import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Customer } from "@/types/customer";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export interface CustomerCheck {
  id: string;
  check_number: string;
  amount: number;
  bank: string;
  issue_date: string;
  due_date: string;
  status: string;
  check_type: string | null;
  issuer_name: string | null;
  issuer_customer_id: string | null;
  issuer_supplier_id: string | null;
  payee: string;
  payee_customer_id: string | null;
  payee_supplier_id: string | null;
  notes: string | null;
  portfolio_status: string | null;
  created_at: string;
}

export const useCustomerChecksQuery = (customer: Customer) => {
  const { userData, loading: userLoading } = useCurrentUser();

  return useQuery({
    queryKey: ['customer-checks', customer.id, userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) {
        console.warn('No company_id available for checks');
        return [];
      }

      // Müşterinin issuer veya payee olduğu tüm çekleri çek
      const { data, error } = await supabase
        .from('checks')
        .select('*')
        .or(`issuer_customer_id.eq.${customer.id},payee_customer_id.eq.${customer.id}`)
        .order('issue_date', { ascending: false });

      if (error) {
        console.error('Error fetching customer checks:', error);
        throw error;
      }

      return (data || []) as CustomerCheck[];
    },
    enabled: !!customer.id && !!userData?.company_id && !userLoading,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: true,
  });
};
