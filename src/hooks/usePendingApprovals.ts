import { useQuery } from "@tanstack/react-query";
import { logger } from '@/utils/logger';
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/hooks/useCompany";

interface Approval {
  id: string;
  type: 'proposal' | 'expense' | 'purchase' | 'leave' | 'budget';
  title: string;
  description: string;
  amount?: number;
  requester: {
    name: string;
    avatar?: string;
  };
  createdAt: string;
  priority: 'low' | 'medium' | 'high';
}

export function usePendingApprovals() {
  const { companyId } = useCompany();

  return useQuery({
    queryKey: ["pending-approvals", companyId],
    queryFn: async (): Promise<Approval[]> => {
      if (!companyId) return [];

      const { data: approvals, error } = await supabase
        .from("approvals")
        .select(`
          id,
          object_type,
          object_id,
          status,
          created_at,
          step,
          profiles:approver_id(
            id,
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq("company_id", companyId)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) {
        logger.error("Error fetching pending approvals:", error);
        return [];
      }

      // Fetch related object data for better context
      const approvalsWithData = await Promise.all(
        (approvals || []).map(async (approval) => {
          let objectData: any = null;
          let requesterName = 'Sistem';
          let amount = 0;

          try {
            switch (approval.object_type) {
              case 'expense_request':
                const { data: expense } = await supabase
                  .from('expense_requests')
                  .select('id, amount, description, requester_id, profiles:requester_id(first_name, last_name)')
                  .eq('id', approval.object_id)
                  .single();
                if (expense) {
                  objectData = expense;
                  amount = Number(expense.amount) || 0;
                  if (expense.profiles) {
                    requesterName = `${(expense.profiles as any).first_name} ${(expense.profiles as any).last_name}`;
                  }
                }
                break;
              case 'purchase_request':
                const { data: purchase } = await supabase
                  .from('purchase_requests')
                  .select('id, total_budget, title, requester_id, profiles:requester_id(first_name, last_name)')
                  .eq('id', approval.object_id)
                  .single();
                if (purchase) {
                  objectData = purchase;
                  amount = Number(purchase.total_budget) || 0;
                  if (purchase.profiles) {
                    requesterName = `${(purchase.profiles as any).first_name} ${(purchase.profiles as any).last_name}`;
                  }
                }
                break;
              case 'leave_request':
                const { data: leave } = await supabase
                  .from('employee_leaves')
                  .select('id, employee_id, employees:employee_id(first_name, last_name)')
                  .eq('id', approval.object_id)
                  .single();
                if (leave && leave.employees) {
                  requesterName = `${(leave.employees as any).first_name} ${(leave.employees as any).last_name}`;
                }
                break;
            }
          } catch (err) {
            logger.error(`Error fetching ${approval.object_type} data:`, err);
          }

          return {
        id: approval.id,
        type: mapApprovalType(approval.object_type),
        title: `${getApprovalTypeLabel(approval.object_type)} Onayı`,
            description: objectData?.description || objectData?.title || `Onay bekleyen ${getApprovalTypeLabel(approval.object_type).toLowerCase()}`,
            amount: amount > 0 ? amount : undefined,
        createdAt: approval.created_at || new Date().toISOString(),
        priority: approval.step && approval.step > 1 ? 'high' : 'medium' as const,
        requester: {
              name: requesterName,
              avatar: (approval.profiles as any)?.avatar_url || undefined
        }
          };
        })
      );

      return approvalsWithData;
    },
    enabled: !!companyId,
    staleTime: 30000
  });
}

function mapApprovalType(type: string): 'proposal' | 'expense' | 'purchase' | 'leave' | 'budget' {
  switch (type) {
    case 'proposal': return 'proposal';
    case 'expense_request': return 'expense';
    case 'purchase_request': return 'purchase';
    case 'leave_request': return 'leave';
    case 'budget_revision': return 'budget';
    default: return 'expense';
  }
}

function getApprovalTypeLabel(type: string): string {
  switch (type) {
    case 'proposal': return 'Teklif';
    case 'expense_request': return 'Harcama';
    case 'purchase_request': return 'Satın Alma';
    case 'leave_request': return 'İzin';
    case 'budget_revision': return 'Bütçe';
    default: return 'Onay';
  }
}
