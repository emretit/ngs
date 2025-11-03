import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { OpportunityStatus, opportunityStatusLabels } from "@/types/crm";
import { logger } from "@/utils/logger";

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
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["opportunities"] });
      toast.success("Durum güncellendi", {
        description: `Fırsat durumu "${opportunityStatusLabels[variables.newStatus]}" olarak güncellendi.`,
        className: "bg-green-50 border-green-200",
      });
    },
    onError: (error) => {
      logger.error("Error updating opportunity status", error);
      toast.error("Hata", {
        description: "Fırsat durumu güncellenirken bir hata oluştu.",
        className: "bg-red-50 border-red-200",
      });
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
