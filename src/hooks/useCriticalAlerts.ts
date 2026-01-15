import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "./useCompany";
import { format, isToday, isPast, addDays } from "date-fns";
import { useOverdueBalances } from "./useOverdueBalances";

export interface CriticalAlert {
  id: string;
  type: "overdue_receivable" | "due_check" | "expired_proposal" | "due_loan_installment";
  title: string;
  description: string;
  severity: "critical" | "warning" | "info";
  amount?: number;
  dueDate?: string;
  link: string;
}

export const useCriticalAlerts = () => {
  const { companyId } = useCompany();
  const { data: overdueBalances = [], isLoading: isLoadingBalances } = useOverdueBalances();

  return useQuery({
    queryKey: ["critical-alerts", companyId, overdueBalances.length],
    queryFn: async (): Promise<CriticalAlert[]> => {
      if (!companyId) {
        throw new Error("Company ID not found");
      }

      const alerts: CriticalAlert[] = [];
      const today = format(new Date(), "yyyy-MM-dd");
      const nextWeek = format(addDays(new Date(), 7), "yyyy-MM-dd");

      // 1. Overdue receivables (müşteri bazında vadesi geçmiş bakiye)
      overdueBalances.forEach((balance) => {
        if (balance.overdueBalance > 0) {
        alerts.push({
            id: `customer-overdue-${balance.customerId}`,
          type: "overdue_receivable",
          title: "Vadesi Geçmiş Alacak",
            description: `${balance.customerName} - Vadesi Geçmiş: ${balance.overdueBalance.toFixed(2)} ${balance.currency}`,
          severity: "critical",
            amount: balance.overdueBalance,
            dueDate: balance.oldestOverdueDate,
            link: `/customers/${balance.customerId}`,
        });
        }
      });

      // 2. Checks due today or this week
      const { data: dueChecks } = await supabase
        .from("checks")
        .select("id, check_number, issuer_name, payee, amount, due_date")
        
        .in("status", ["pending", "in_portfolio"])
        .gte("due_date", today)
        .lte("due_date", nextWeek)
        .order("due_date", { ascending: true })
        .limit(5);

      dueChecks?.forEach((check) => {
        const checkDate = new Date(check.due_date);
        const isTodayCheck = isToday(checkDate);
        
        alerts.push({
          id: `check-${check.id}`,
          type: "due_check",
          title: isTodayCheck ? "Bugün Vadeli Çek" : "Yaklaşan Vadeli Çek",
          description: `${check.issuer_name || check.payee} - Çek No: ${check.check_number}`,
          severity: isTodayCheck ? "critical" : "warning",
          amount: check.amount,
          dueDate: check.due_date,
          link: "/finance/checks",
        });
      });

      // 3. Expired proposals
      const { data: expiredProposals } = await supabase
        .from("proposals")
        .select(`
          id,
          number,
          title,
          valid_until,
          total_amount,
          customer_id,
          customers (name)
        `)
        .in("status", ["pending", "sent"])
        .lt("valid_until", today)
        .order("valid_until", { ascending: true })
        .limit(10);

      expiredProposals?.forEach((proposal) => {
        const customerName = (proposal.customers as any)?.name || "Bilinmeyen Müşteri";
        alerts.push({
          id: `proposal-${proposal.id}`,
          type: "expired_proposal",
          title: "Süresi Geçmiş Teklif",
          description: `${customerName} - ${proposal.title || proposal.number}`,
          severity: "warning",
          amount: proposal.total_amount,
          dueDate: proposal.valid_until || undefined,
          link: `/proposals/${proposal.id}`,
        });
      });

      // 4. Loan installments due this month
      const { data: activeLoans } = await supabase
        .from("loans")
        .select("id, loan_name, bank, installment_amount, start_date, end_date, installment_count, remaining_debt")

        .eq("status", "active")
        .lte("start_date", nextWeek)
        .gte("end_date", today);

      if (activeLoans) {
        for (const loan of activeLoans) {
          // Bu ay için ödeme yapılmış mı kontrol et
          const startOfMonth = format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), "yyyy-MM-dd");
          const endOfMonth = format(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), "yyyy-MM-dd");

          const { data: monthlyPayments } = await supabase
            .from("loan_payments")
            .select("payment_amount")
            .eq("loan_id", loan.id)
            .gte("payment_date", startOfMonth)
            .lte("payment_date", endOfMonth);

          const totalPaidThisMonth = monthlyPayments?.reduce((sum, p) => sum + p.payment_amount, 0) || 0;

          // Eğer bu ay için tam ödeme yapılmamışsa uyarı ver
          if (totalPaidThisMonth < loan.installment_amount) {
            const remainingAmount = loan.installment_amount - totalPaidThisMonth;

            alerts.push({
              id: `loan-${loan.id}`,
              type: "due_loan_installment",
              title: "Kredi Taksiti",
              description: `${loan.bank} - ${loan.loan_name}`,
              severity: remainingAmount === loan.installment_amount ? "warning" : "info",
              amount: remainingAmount,
              dueDate: endOfMonth,
              link: "/finance/loans",
            });
          }
        }
      }

      // Sort by severity (critical first) then by date
      return alerts.sort((a, b) => {
        const severityOrder = { critical: 0, warning: 1, info: 2 };
        if (severityOrder[a.severity] !== severityOrder[b.severity]) {
          return severityOrder[a.severity] - severityOrder[b.severity];
        }
        if (a.dueDate && b.dueDate) {
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }
        return 0;
      });
    },
    enabled: !!companyId && !isLoadingBalances,
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });
};
