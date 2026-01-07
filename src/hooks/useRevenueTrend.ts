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

        // ============ GELİR KAYNAKLARI ============

        // 1. Satış Faturaları (onaylanan faturalar)
        const { data: salesData } = await supabase
          .from('sales_invoices')
          .select('toplam_tutar')
          .eq('durum', 'onaylandi')
          .gte('fatura_tarihi', monthStart)
          .lte('fatura_tarihi', monthEnd);

        const salesIncome = salesData?.reduce((sum, inv) => sum + (Number(inv.toplam_tutar) || 0), 0) || 0;

        // 2. Diğer Gelirler (expenses tablosunda type='income' olanlar)
        // Faiz gelirleri, kira gelirleri, vb.
        const { data: incomeData } = await supabase
          .from('expenses')
          .select('amount')
          .eq('type', 'income')
          .gte('date', monthStart)
          .lte('date', monthEnd);

        const otherIncome = incomeData?.reduce((sum, inc) => sum + (Number(inc.amount) || 0), 0) || 0;

        // 3. Banka Gelir İşlemleri
        const { data: bankIncomeData } = await supabase
          .from('bank_transactions')
          .select('amount')
          .eq('transaction_type', 'giris')
          .gte('transaction_date', monthStart)
          .lte('transaction_date', monthEnd);

        const bankIncome = bankIncomeData?.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0) || 0;

        // 4. Nakit Gelir İşlemleri
        const { data: cashIncomeData } = await supabase
          .from('cash_transactions')
          .select('amount')
          .eq('type', 'income')
          .gte('transaction_date', monthStart)
          .lte('transaction_date', monthEnd);

        const cashIncome = cashIncomeData?.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0) || 0;

        // 5. Kredi Kartı Gelir İşlemleri (iadeler vb.) - credit_card_transactions uses transaction_type column
        const { data: cardIncomeData } = await supabase
          .from('card_transactions')
          .select('amount')
          .in('transaction_type', ['payment', 'refund'])
          .gte('transaction_date', monthStart)
          .lte('transaction_date', monthEnd);

        const cardIncome = cardIncomeData?.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0) || 0;

        // Toplam Gelir
        const totalIncome = salesIncome + otherIncome + bankIncome + cashIncome + cardIncome;

        // ============ GİDER KAYNAKLARI ============

        // 1. Genel Giderler (expenses tablosunda type='expense' olanlar)
        const { data: expenseData } = await supabase
          .from('expenses')
          .select('amount')
          .eq('type', 'expense')
          .gte('date', monthStart)
          .lte('date', monthEnd);

        const generalExpenses = expenseData?.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0) || 0;

        // 2. Alış Faturaları (purchase_invoices)
        const { data: purchaseInvoicesData } = await supabase
          .from('purchase_invoices')
          .select('total_amount')
          .gte('invoice_date', monthStart)
          .lte('invoice_date', monthEnd);

        const purchaseInvoices = purchaseInvoicesData?.reduce((sum, inv) => sum + (Number(inv.total_amount) || 0), 0) || 0;

        // 3. E-Faturalar (einvoices - incoming yönlü)
        const { data: einvoicesData } = await supabase
          .from('einvoices')
          .select('total_amount')
          .eq('direction', 'incoming')
          .gte('invoice_date', monthStart)
          .lte('invoice_date', monthEnd);

        const einvoicesExpense = einvoicesData?.reduce((sum, inv) => sum + (Number(inv.total_amount) || 0), 0) || 0;

        // 4. Banka Gider İşlemleri
        const { data: bankExpenseData } = await supabase
          .from('bank_transactions')
          .select('amount')
          .eq('transaction_type', 'cikis')
          .gte('transaction_date', monthStart)
          .lte('transaction_date', monthEnd);

        const bankExpense = bankExpenseData?.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0) || 0;

        // 5. Nakit Gider İşlemleri
        const { data: cashExpenseData } = await supabase
          .from('cash_transactions')
          .select('amount')
          .eq('type', 'expense')
          .gte('transaction_date', monthStart)
          .lte('transaction_date', monthEnd);

        const cashExpense = cashExpenseData?.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0) || 0;

        // 6. Kredi Kartı Gider İşlemleri - card_transactions table
        const { data: cardExpenseData } = await supabase
          .from('card_transactions')
          .select('amount')
          .eq('transaction_type', 'purchase')
          .gte('transaction_date', monthStart)
          .lte('transaction_date', monthEnd);

        const cardExpense = cardExpenseData?.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0) || 0;

        // 7. Araç Yakıt Giderleri
        const { data: fuelExpenseData } = await supabase
          .from('vehicle_fuel')
          .select('total_cost')
          .gte('fuel_date', monthStart)
          .lte('fuel_date', monthEnd);

        const fuelExpense = fuelExpenseData?.reduce((sum, fuel) => sum + (Number(fuel.total_cost) || 0), 0) || 0;

        // 8. Araç Bakım Giderleri
        const { data: maintenanceExpenseData } = await supabase
          .from('vehicle_maintenance')
          .select('cost')
          .gte('maintenance_date', monthStart)
          .lte('maintenance_date', monthEnd);

        const maintenanceExpense = maintenanceExpenseData?.reduce((sum, maint) => sum + (Number(maint.cost) || 0), 0) || 0;

        // Toplam Gider
        const totalExpense = generalExpenses + purchaseInvoices + einvoicesExpense +
                            bankExpense + cashExpense + cardExpense +
                            fuelExpense + maintenanceExpense;

        months.push({
          month: monthName,
          income: totalIncome,
          expense: totalExpense,
          profit: totalIncome - totalExpense
        });
      }

      return months;
    },
    enabled: !!userData?.company_id,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};
