import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useCompany } from "@/hooks/useCompany";
import { ApprovalWorkflow, ApprovalObjectType, ThresholdRule } from "@/types/approval";

export const useApprovalWorkflows = () => {
  const { companyId } = useCompany();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: workflows, isLoading } = useQuery({
    queryKey: ["approval-workflows", companyId],
    queryFn: async () => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from("approval_workflows")
        .select("*")
        
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ApprovalWorkflow[];
    },
    enabled: !!companyId,
  });

  const createWorkflow = useMutation({
    mutationFn: async (workflow: Partial<ApprovalWorkflow>) => {
      const { data, error } = await supabase
        .from("approval_workflows")
        .insert({ ...workflow, company_id: companyId })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approval-workflows"] });
      toast({ title: "Başarılı", description: "Onay süreci oluşturuldu" });
    },
  });

  const updateWorkflow = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ApprovalWorkflow> }) => {
      const { data, error } = await supabase
        .from("approval_workflows")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approval-workflows"] });
      toast({ title: "Başarılı", description: "Onay süreci güncellendi" });
    },
  });

  const deleteWorkflow = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("approval_workflows")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approval-workflows"] });
      toast({ title: "Başarılı", description: "Onay süreci silindi" });
    },
  });

  const getWorkflow = (objectType: ApprovalObjectType) => {
    return workflows?.find(w => w.object_type === objectType && w.is_active);
  };

  return {
    workflows,
    isLoading,
    createWorkflow: createWorkflow.mutate,
    updateWorkflow: updateWorkflow.mutate,
    deleteWorkflow: deleteWorkflow.mutate,
    getWorkflow,
  };
};

