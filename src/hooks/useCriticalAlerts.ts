import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "./useCompany";
import { format, isToday, isPast, addDays } from "date-fns";

export interface CriticalAlert {
  id: string;
  type: "overdue_receivable" | "due_check" | "urgent_approval" | "overdue_task";
  title: string;
  description: string;
  severity: "critical" | "warning" | "info";
  amount?: number;
  dueDate?: string;
  link: string;
}

export const useCriticalAlerts = () => {
  const { companyId } = useCompany();

  return useQuery({
    queryKey: ["critical-alerts", companyId],
    queryFn: async (): Promise<CriticalAlert[]> => {
      if (!companyId) {
        throw new Error("Company ID not found");
      }

      const alerts: CriticalAlert[] = [];
      const today = format(new Date(), "yyyy-MM-dd");
      const nextWeek = format(addDays(new Date(), 7), "yyyy-MM-dd");

      // 1. Overdue receivables (unpaid invoices past due date)
      const { data: overdueInvoices } = await supabase
        .from("sales_invoices")
        .select("id, invoice_number, customer_name, total_amount, due_date")
        .eq("company_id", companyId)
        .eq("payment_status", "unpaid")
        .lt("due_date", today)
        .order("due_date", { ascending: true })
        .limit(5);

      overdueInvoices?.forEach((invoice) => {
        alerts.push({
          id: `invoice-${invoice.id}`,
          type: "overdue_receivable",
          title: "Vadesi Geçmiş Alacak",
          description: `${invoice.customer_name} - ${invoice.invoice_number}`,
          severity: "critical",
          amount: invoice.total_amount,
          dueDate: invoice.due_date,
          link: `/sales/invoices/${invoice.id}`,
        });
      });

      // 2. Checks due today or this week
      const { data: dueChecks } = await supabase
        .from("checks")
        .select("id, check_number, issuer_name, payee, amount, due_date")
        .eq("company_id", companyId)
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

      // 3. Pending urgent approvals
      const { data: pendingApprovals } = await supabase
        .from("approvals")
        .select("id, object_type, object_id, created_at")
        .eq("company_id", companyId)
        .eq("status", "pending")
        .order("created_at", { ascending: true })
        .limit(5);

      pendingApprovals?.forEach((approval) => {
        const createdDate = new Date(approval.created_at || "");
        const daysPending = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysPending >= 1) {
          alerts.push({
            id: `approval-${approval.id}`,
            type: "urgent_approval",
            title: "Bekleyen Onay",
            description: `${approval.object_type} - ${daysPending} gündür bekliyor`,
            severity: daysPending >= 3 ? "critical" : "warning",
            link: `/approvals/${approval.id}`,
          });
        }
      });

      // 4. Overdue tasks
      const { data: overdueTasks } = await supabase
        .from("activities")
        .select("id, title, due_date, priority")
        .eq("company_id", companyId)
        .eq("type", "task")
        .neq("status", "completed")
        .lt("due_date", today)
        .order("due_date", { ascending: true })
        .limit(3);

      overdueTasks?.forEach((task) => {
        alerts.push({
          id: `task-${task.id}`,
          type: "overdue_task",
          title: "Gecikmiş Görev",
          description: task.title,
          severity: task.priority === "high" ? "critical" : "warning",
          dueDate: task.due_date || undefined,
          link: `/activities?taskId=${task.id}`,
        });
      });

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
    enabled: !!companyId,
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });
};
