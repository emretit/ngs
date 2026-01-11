import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { logger } from '@/utils/logger';
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Payment } from "@/types/payment";

interface UseCustomerPaymentsFilters {
  customerId: string;
}

export const useCustomerPaymentsInfiniteScroll = (filters: UseCustomerPaymentsFilters) => {
  const { userData } = useCurrentUser();

  const fetchPayments = async (page: number, pageSize: number) => {
    if (!userData?.company_id || !filters.customerId) {
      return {
        data: [] as Payment[],
        totalCount: 0,
        hasNextPage: false
      };
    }

    // Pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
      .from('payments')
      .select('*', { count: 'exact' })
      .eq('customer_id', filters.customerId)
      .order('payment_date', { ascending: false })
      .range(from, to);

    if (error) {
      logger.error('Error fetching customer payments:', error);
      throw error;
    }

    return {
      data: (data || []) as Payment[],
      totalCount: count || 0,
      hasNextPage: (data?.length || 0) === pageSize
    };
  };

  return useInfiniteScroll(
    ["customer-payments-infinite", filters.customerId, userData?.company_id],
    fetchPayments,
    {
      pageSize: 20,
      enabled: !!filters.customerId && !!userData?.company_id,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    }
  );
};

