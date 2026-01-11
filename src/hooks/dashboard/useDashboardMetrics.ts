import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "../useCurrentUser";

export const useDashboardMetrics = () => {
  const { userData } = useCurrentUser();

  const { data: totalCustomers, isLoading: isTotalCustomersLoading } = useQuery({
    queryKey: ['dashboard-total-customers', userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return { total: 0, active: 0 };
      const { data, error } = await supabase
        .from('customers')
        .select('id, status, is_active');
      if (error) throw error;
      const total = data?.length || 0;
      const active = data?.filter(c => c.status === 'aktif' || c.is_active === true).length || 0;
      return { total, active };
    },
    enabled: !!userData?.company_id,
    staleTime: 5 * 60 * 1000,
  });

  const { data: previousMonthSales, isLoading: isPreviousMonthSalesLoading } = useQuery({
    queryKey: ['dashboard-previous-month-sales', userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return 0;
      const now = new Date();
      const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
      const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('sales_invoices')
        .select('toplam_tutar')
        .eq('durum', 'onaylandi')
        .gte('fatura_tarihi', previousMonthStart)
        .lte('fatura_tarihi', previousMonthEnd);
      if (error) throw error;
      return data?.reduce((sum, inv) => sum + (Number(inv.toplam_tutar) || 0), 0) || 0;
    },
    enabled: !!userData?.company_id,
    staleTime: 5 * 60 * 1000,
  });

  const { data: totalReceivables, isLoading: isTotalReceivablesLoading } = useQuery({
    queryKey: ['dashboard-total-receivables', userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return 0;
      const { data, error } = await supabase
        .from('customers')
        .select('balance');
      if (error) throw error;
      return data?.reduce((sum, customer) => {
        const balance = Number(customer.balance) || 0;
        return sum + (balance > 0 ? balance : 0);
      }, 0) || 0;
    },
    enabled: !!userData?.company_id,
    staleTime: 5 * 60 * 1000,
  });

  const { data: opportunitiesValue, isLoading: isOpportunitiesValueLoading } = useQuery({
    queryKey: ['dashboard-opportunities-value', userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return { totalValue: 0, count: 0 };
      const { data, error } = await supabase
        .from('opportunities')
        .select('value, currency')
        .in('status', ['open', 'in_progress']);
      if (error) throw error;
      const totalValue = data?.reduce((sum, opp) => sum + (Number(opp.value) || 0), 0) || 0;
      const count = data?.length || 0;
      return { totalValue, count };
    },
    enabled: !!userData?.company_id,
    staleTime: 5 * 60 * 1000,
  });

  return {
    totalCustomers: totalCustomers?.total || 0,
    activeCustomers: totalCustomers?.active || 0,
    previousMonthSales: previousMonthSales || 0,
    totalReceivables: totalReceivables || 0,
    opportunitiesValue: opportunitiesValue?.totalValue || 0,
    opportunitiesCount: opportunitiesValue?.count || 0,
    isLoading: isTotalCustomersLoading || isPreviousMonthSalesLoading || 
               isTotalReceivablesLoading || isOpportunitiesValueLoading,
  };
};
