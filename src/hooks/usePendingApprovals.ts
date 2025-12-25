import { useQuery } from "@tanstack/react-query";
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

      const { data, error } = await supabase
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
        console.error("Error fetching pending approvals:", error);
        return [];
      }

      // Transform data
      return (data || []).map(approval => ({
        id: approval.id,
        type: mapApprovalType(approval.object_type),
        title: `${getApprovalTypeLabel(approval.object_type)} Onayı`,
        description: `Onay bekleyen ${getApprovalTypeLabel(approval.object_type).toLowerCase()}`,
        createdAt: approval.created_at || new Date().toISOString(),
        priority: approval.step && approval.step > 1 ? 'high' : 'medium' as const,
        requester: {
          name: 'Sistem',
          avatar: undefined
        }
      }));
    },
    enabled: !!companyId,
    staleTime: 30000
  });
}

function mapApprovalType(type: string): 'proposal' | 'expense' | 'purchase' | 'leave' | 'budget' {
  switch (type) {
    case 'proposal': return 'proposal';
    case 'expense': return 'expense';
    case 'purchase_request': return 'purchase';
    case 'leave_request': return 'leave';
    case 'budget_revision': return 'budget';
    default: return 'expense';
  }
}

function getApprovalTypeLabel(type: string): string {
  switch (type) {
    case 'proposal': return 'Teklif';
    case 'expense': return 'Masraf';
    case 'purchase_request': return 'Satın Alma';
    case 'leave_request': return 'İzin';
    case 'budget_revision': return 'Bütçe';
    default: return 'Onay';
  }
}
