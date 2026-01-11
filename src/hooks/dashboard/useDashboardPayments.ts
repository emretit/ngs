import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "../useCurrentUser";

export const useDashboardPayments = () => {
  const { userData } = useCurrentUser();

  const { data: overdueReceivables, isLoading: isOverdueReceivablesLoading } = useQuery({
    queryKey: ['dashboard-overdue-receivables', userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return [];
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('sales_invoices')
        .select('id, fatura_no, toplam_tutar, odenen_tutar, vade_tarihi, customers(name, company)')
        .eq('odeme_durumu', 'odenmedi')
        .lt('vade_tarihi', today)
        .order('vade_tarihi', { ascending: true })
        .limit(10);
      if (error) throw error;
      return (data || []).map(inv => {
        const customer = inv.customers as any;
        const daysOverdue = Math.floor((new Date().getTime() - new Date(inv.vade_tarihi).getTime()) / (1000 * 60 * 60 * 24));
        const remaining = Number(inv.toplam_tutar) - Number(inv.odenen_tutar);
        return {
          id: inv.id,
          invoiceNumber: inv.fatura_no,
          customerName: customer?.name || customer?.company || 'Bilinmeyen',
          amount: remaining,
          daysOverdue
        };
      });
    },
    enabled: !!userData?.company_id,
    staleTime: 5 * 60 * 1000,
  });

  const { data: upcomingChecks, isLoading: isUpcomingChecksLoading } = useQuery({
    queryKey: ['dashboard-upcoming-checks', userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return [];
      const today = new Date().toISOString().split('T')[0];
      const next30Days = new Date();
      next30Days.setDate(next30Days.getDate() + 30);
      const next30DaysStr = next30Days.toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('checks')
        .select('id, check_number, amount, due_date, issuer_name, payee, status')
        .in('check_type', ['incoming', 'outgoing'])
        .in('status', ['odenecek', 'tahsilat_bekleniyor', 'portfoyde'])
        .gte('due_date', today)
        .lte('due_date', next30DaysStr)
        .order('due_date', { ascending: true })
        .limit(10);
      if (error) throw error;
      return (data || []).map(check => ({
        id: check.id,
        checkNumber: check.check_number,
        amount: Number(check.amount) || 0,
        dueDate: check.due_date,
        issuerName: check.issuer_name || check.payee || 'Bilinmeyen',
        status: check.status
      }));
    },
    enabled: !!userData?.company_id,
    staleTime: 5 * 60 * 1000,
  });

  const { data: upcomingExpenses, isLoading: isUpcomingExpensesLoading } = useQuery({
    queryKey: ['dashboard-upcoming-expenses', userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return [];
      const today = new Date().toISOString().split('T')[0];
      const next30Days = new Date();
      next30Days.setDate(next30Days.getDate() + 30);
      const next30DaysStr = next30Days.toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('expenses')
        .select('id, amount, date, description, category_id, cashflow_categories(name)')
        .eq('type', 'expense')
        .eq('is_paid', false)
        .gte('date', today)
        .lte('date', next30DaysStr)
        .order('date', { ascending: true })
        .limit(10);
      if (error) throw error;
      return (data || []).map(exp => {
        const category = exp.cashflow_categories as any;
        return {
          id: exp.id,
          amount: Number(exp.amount) || 0,
          date: exp.date,
          description: exp.description || category?.name || 'Masraf',
          category: category?.name || 'Genel'
        };
      });
    },
    enabled: !!userData?.company_id,
    staleTime: 5 * 60 * 1000,
  });

  return {
    overdueReceivables: overdueReceivables || [],
    upcomingChecks: upcomingChecks || [],
    upcomingExpenses: upcomingExpenses || [],
    isLoading: isOverdueReceivablesLoading || isUpcomingChecksLoading || isUpcomingExpensesLoading,
  };
};
