
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { logger } from '@/utils/logger';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useDeleteServiceMutation = () => {
  const queryClient = useQueryClient();

  // Delete service request
  const deleteServiceRequestMutation = useMutation({
    mutationFn: async (id: string) => {
      // First delete related activities
      const { error: activitiesError } = await supabase
        .from('service_activities')
        .delete()
        .eq('service_request_id', id);

      if (activitiesError) throw activitiesError;

      // Then delete the request
      const { error } = await supabase
        .from('service_requests')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-requests'] });
      toast.success("Service request deleted successfully");
    },
    onError: (error) => {
      logger.error('Service request deletion error:', error);
      toast.error("Failed to delete service request");
    },
  });

  return {
    deleteServiceRequest: deleteServiceRequestMutation.mutate,
    isDeleting: deleteServiceRequestMutation.isPending,
  };
};
