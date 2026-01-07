import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "./useCurrentUser";

export const useDashboardData = () => {
  const { userData } = useCurrentUser();

  // Combined financial data query
  const { data: financialData, isLoading: isFinancialLoading } = useQuery({
    queryKey: ['dashboard-financial', userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return null;

      // Get current month start and end dates
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

      // ✅ RLS policy otomatik olarak current_company_id() ile filtreler (Tüm tablolar artık güvenli!)
      const [bankAccounts, cashAccounts, customers, invoices, monthlyRevenue] = await Promise.all([
        supabase.from('bank_accounts').select('current_balance'),
        supabase.from('cash_accounts').select('current_balance'),
        supabase.from('customers').select('balance'),
        supabase.from('einvoices').select('remaining_amount'),
        // Aylık ciro: Bu ayki onaylanmış satış faturalarının toplamı
        supabase
          .from('sales_invoices')
          .select('toplam_tutar')
          .eq('durum', 'onaylandi')
          .gte('fatura_tarihi', currentMonthStart)
          .lte('fatura_tarihi', currentMonthEnd)
      ]);

      const totalBankBalance = bankAccounts.data?.reduce((sum, acc) => sum + (Number(acc.current_balance) || 0), 0) || 0;
      const totalCashBalance = cashAccounts.data?.reduce((sum, acc) => sum + (Number(acc.current_balance) || 0), 0) || 0;
      const totalReceivables = customers.data?.reduce((sum, c) => sum + (Number(c.balance) || 0), 0) || 0;
      const totalPayables = invoices.data?.reduce((sum, inv) => sum + (Number(inv.remaining_amount) || 0), 0) || 0;
      // Aylık ciro hesaplama
      const monthlyTurnover = monthlyRevenue.data?.reduce((sum, inv) => sum + (Number(inv.toplam_tutar) || 0), 0) || 0;

      return {
        cashFlow: totalBankBalance + totalCashBalance,
        monthlyTurnover: monthlyTurnover, // Aylık ciro
        receivables: totalReceivables,
        payables: totalPayables,
        netWorth: totalBankBalance + totalCashBalance + totalReceivables - totalPayables
      };
    },
    enabled: !!userData?.company_id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes - garbage collection
    refetchOnWindowFocus: false, // Don't refetch on tab switch
    retry: 2, // Retry twice on failure
  });

  // Combined CRM stats query
  const { data: crmStats, isLoading: isCrmLoading } = useQuery({
    queryKey: ['dashboard-crm', userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return null;

      // RLS policy otomatik olarak current_company_id() ile filtreler
      const [opportunities, activities, proposals] = await Promise.all([
        supabase.from('opportunities').select('id').in('status', ['open', 'in_progress']),
        supabase.from('activities').select('id').in('status', ['todo', 'in_progress']),
        supabase.from('proposals').select('id').eq('status', 'draft')
      ]);

      return {
        opportunities: opportunities.data?.length || 0,
        activities: activities.data?.length || 0,
        proposals: proposals.data?.length || 0
      };
    },
    enabled: !!userData?.company_id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 2,
  });

  // Combined HR stats query
  const { data: hrStats, isLoading: isHrLoading } = useQuery({
    queryKey: ['dashboard-hr', userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return null;

      // RLS policy otomatik olarak current_company_id() ile filtreler
      const [employees, leaves] = await Promise.all([
        supabase.from('employees').select('id').eq('status', 'aktif'),
        supabase.from('employee_leaves').select('id').eq('status', 'approved').gte('end_date', new Date().toISOString())
      ]);

      return {
        totalEmployees: employees.data?.length || 0,
        onLeave: leaves.data?.length || 0
      };
    },
    enabled: !!userData?.company_id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 2,
  });

  return {
    financialData,
    crmStats,
    hrStats,
    isLoading: isFinancialLoading || isCrmLoading || isHrLoading
  };
};
