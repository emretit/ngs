import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Approval, ApprovalObjectType } from "@/types/approval";

export const useHierarchicalApprovals = (
  objectType: ApprovalObjectType,
  objectId: string | null
) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Onay zincirini getir
  const { data: approvals, isLoading } = useQuery({
    queryKey: ["approvals", objectType, objectId],
    queryFn: async () => {
      if (!objectId) return [];

      const { data, error } = await supabase
        .from("approvals")
        .select("*")
        .eq("object_type", objectType)
        .eq("object_id", objectId)
        .order("step", { ascending: true });

      if (error) throw error;
      return data as Approval[];
    },
    enabled: !!objectId,
  });

  // Onaylama
  const approveMutation = useMutation({
    mutationFn: async ({
      approvalId,
      comment
    }: {
      approvalId: string;
      comment?: string
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Kullanıcı oturumu bulunamadı");

      const { data, error } = await supabase.rpc("process_approval", {
        p_approval_id: approvalId,
        p_approver_id: user.id,
        p_action: "approve",
        p_comment: comment,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approvals", objectType, objectId] });
      queryClient.invalidateQueries({ queryKey: ["pending-approvals"] });
      toast({
        title: "Başarılı",
        description: "Talep onaylandı",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Hata",
        description: error.message,
      });
    },
  });

  // Reddetme
  const rejectMutation = useMutation({
    mutationFn: async ({
      approvalId,
      reason
    }: {
      approvalId: string;
      reason: string
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Kullanıcı oturumu bulunamadı");

      const { data, error } = await supabase.rpc("process_approval", {
        p_approval_id: approvalId,
        p_approver_id: user.id,
        p_action: "reject",
        p_comment: reason,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approvals", objectType, objectId] });
      queryClient.invalidateQueries({ queryKey: ["pending-approvals"] });
      toast({
        title: "Başarılı",
        description: "Talep reddedildi",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Hata",
        description: error.message,
      });
    },
  });

  return {
    approvals,
    isLoading,
    approve: approveMutation.mutate,
    reject: rejectMutation.mutate,
    isApproving: approveMutation.isPending,
    isRejecting: rejectMutation.isPending,
  };
};

