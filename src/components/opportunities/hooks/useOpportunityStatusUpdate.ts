import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { OpportunityStatus } from "@/types/crm";

export const useOpportunityStatusUpdate = () => {
  const queryClient = useQueryClient();

  const updateStatusMutation = useMutation({
    mutationFn: async ({ 
      opportunityId, 
      newStatus 
    }: { 
      opportunityId: string; 
      newStatus: OpportunityStatus 
    }) => {
      const { data, error } = await supabase
        .from("opportunities")
        .update({ status: newStatus })
        .eq("id", opportunityId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["opportunities"] });
      toast.success("Fırsat durumu başarıyla güncellendi");
    },
    onError: (error) => {
      console.error("Error updating opportunity status:", error);
      toast.error("Fırsat durumu güncellenirken bir hata oluştu");
    },
  });

  const updateOpportunityStatus = (opportunityId: string, newStatus: OpportunityStatus) => {
    updateStatusMutation.mutate({ opportunityId, newStatus });
  };

  return {
    updateOpportunityStatus,
    isUpdating: updateStatusMutation.isPending,
  };
};
