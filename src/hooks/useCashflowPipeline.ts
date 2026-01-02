import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "./useCompany";

interface CashflowPipelineData {
  receivables: {
    count: number;
    value: number;
    overdue: number;
    overdueValue: number;
  };
  payables: {
    count: number;
    value: number;
    overdue: number;
    overdueValue: number;
  };
  checksReceivable: {
    count: number;
    value: number;
    dueSoon: number;
    dueSoonValue: number;
  };
  checksPayable: {
    count: number;
    value: number;
    dueSoon: number;
    dueSoonValue: number;
  };
  bankBalance: {
    totalTRY: number;
    totalUSD: number;
    totalEUR: number;
    accountCount: number;
  };
  cashBalance: {
    total: number;
    accountCount: number;
  };
}

export const useCashflowPipeline = () => {
  const { companyId } = useCompany();
  const today = new Date().toISOString().split('T')[0];
  const sevenDaysLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  return useQuery({
    queryKey: ["cashflow-pipeline", companyId],
    queryFn: async (): Promise<CashflowPipelineData> => {
      if (!companyId) {
        throw new Error("Company ID not found");
      }

      // Fetch all data in parallel
      const [
        salesInvoicesRes,
        purchaseInvoicesRes,
        checksRes,
        bankAccountsRes,
        cashAccountsRes
      ] = await Promise.all([
        // Receivables - unpaid sales invoices
        supabase
          .from("sales_invoices")
          .select("id, toplam_tutar, vade_tarihi, odeme_durumu")
          .eq("company_id", companyId)
          .in("odeme_durumu", ["odenmedi", "kismi_odendi"]),
        
        // Payables - unpaid purchase invoices
        supabase
          .from("purchase_invoices")
          .select("id, total_amount, due_date, status")
          .eq("company_id", companyId)
          .neq("status", "paid"),
        
        // Checks
        supabase
          .from("checks")
          .select("id, amount, due_date, check_type, status")
          .eq("company_id", companyId)
          .in("status", ["odenecek", "portfoyde"]),
        
        // Bank accounts
        supabase
          .from("bank_accounts")
          .select("id, current_balance, currency, is_active")
          .eq("company_id", companyId)
          .eq("is_active", true),
        
        // Cash accounts
        supabase
          .from("cash_accounts")
          .select("id, current_balance, is_active")
          .eq("company_id", companyId)
          .eq("is_active", true)
      ]);

      // Process receivables
      const receivables = salesInvoicesRes.data || [];
      const overdueReceivables = receivables.filter(r => r.vade_tarihi && r.vade_tarihi < today);
      
      // Process payables
      const payables = purchaseInvoicesRes.data || [];
      const overduePayables = payables.filter(p => p.due_date && p.due_date < today);
      
      // Process checks
      const checks = checksRes.data || [];
      const receivableChecks = checks.filter(c => c.check_type === "incoming");
      const payableChecks = checks.filter(c => c.check_type === "outgoing");
      
      const dueSoonReceivableChecks = receivableChecks.filter(
        c => c.due_date && c.due_date >= today && c.due_date <= sevenDaysLater
      );
      const dueSoonPayableChecks = payableChecks.filter(
        c => c.due_date && c.due_date >= today && c.due_date <= sevenDaysLater
      );
      
      // Process bank balances
      const bankAccounts = bankAccountsRes.data || [];
      const tryAccounts = bankAccounts.filter(a => a.currency === "TRY");
      const usdAccounts = bankAccounts.filter(a => a.currency === "USD");
      const eurAccounts = bankAccounts.filter(a => a.currency === "EUR");
      
      // Process cash balances
      const cashAccounts = cashAccountsRes.data || [];

      return {
        receivables: {
          count: receivables.length,
          value: receivables.reduce((sum, r) => sum + (r.toplam_tutar || 0), 0),
          overdue: overdueReceivables.length,
          overdueValue: overdueReceivables.reduce((sum, r) => sum + (r.toplam_tutar || 0), 0)
        },
        payables: {
          count: payables.length,
          value: payables.reduce((sum, p) => sum + (p.total_amount || 0), 0),
          overdue: overduePayables.length,
          overdueValue: overduePayables.reduce((sum, p) => sum + (p.total_amount || 0), 0)
        },
        checksReceivable: {
          count: receivableChecks.length,
          value: receivableChecks.reduce((sum, c) => sum + (c.amount || 0), 0),
          dueSoon: dueSoonReceivableChecks.length,
          dueSoonValue: dueSoonReceivableChecks.reduce((sum, c) => sum + (c.amount || 0), 0)
        },
        checksPayable: {
          count: payableChecks.length,
          value: payableChecks.reduce((sum, c) => sum + (c.amount || 0), 0),
          dueSoon: dueSoonPayableChecks.length,
          dueSoonValue: dueSoonPayableChecks.reduce((sum, c) => sum + (c.amount || 0), 0)
        },
        bankBalance: {
          totalTRY: tryAccounts.reduce((sum, a) => sum + (a.current_balance || 0), 0),
          totalUSD: usdAccounts.reduce((sum, a) => sum + (a.current_balance || 0), 0),
          totalEUR: eurAccounts.reduce((sum, a) => sum + (a.current_balance || 0), 0),
          accountCount: bankAccounts.length
        },
        cashBalance: {
          total: cashAccounts.reduce((sum, a) => sum + (a.current_balance || 0), 0),
          accountCount: cashAccounts.length
        }
      };
    },
    enabled: !!companyId,
  });
};
