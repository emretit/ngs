import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "./useCurrentUser";

export const useRevenueTrend = () => {
  const { userData } = useCurrentUser();

  return useQuery({
    queryKey: ['dashboard-revenue-trend', userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return [];

      // Get last 6 months of data
      const months: { month: string; income: number; expense: number; profit: number }[] = [];
      const now = new Date();

      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];

        const monthNames = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
        const monthName = monthNames[date.getMonth()];

        // Get income from sales invoices
        const { data: salesData } = await supabase
          .from('sales_invoices')
          .select('toplam_tutar')
          .eq('company_id', userData.company_id)
          .eq('durum', 'onaylandi')
          .gte('fatura_tarihi', monthStart)
          .lte('fatura_tarihi', monthEnd);

        const income = salesData?.reduce((sum, inv) => sum + (Number(inv.toplam_tutar) || 0), 0) || 0;

        // Get expenses
        const { data: expenseData } = await supabase
          .from('expenses')
          .select('amount')
          .eq('company_id', userData.company_id)
          .eq('type', 'expense')
          .gte('date', monthStart)
          .lte('date', monthEnd);

        // Also include purchase invoices as expenses
        const { data: purchaseData } = await supabase
          .from('einvoices')
          .select('total_amount')
          .eq('company_id', userData.company_id)
          .eq('direction', 'incoming')
          .gte('invoice_date', monthStart)
          .lte('invoice_date', monthEnd);

        const expenseAmount = expenseData?.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0) || 0;
        const purchaseAmount = purchaseData?.reduce((sum, inv) => sum + (Number(inv.total_amount) || 0), 0) || 0;
        const expense = expenseAmount + purchaseAmount;

        months.push({
          month: monthName,
          income,
          expense,
          profit: income - expense
        });
      }

      return months;
    },
    enabled: !!userData?.company_id,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};
