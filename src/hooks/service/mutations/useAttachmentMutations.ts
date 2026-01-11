
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { logger } from '@/utils/logger';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useServiceQueries } from "../useServiceQueries";
import { ServiceRequestAttachment } from "../types";

export const useAttachmentMutations = () => {
  const queryClient = useQueryClient();
  const { getServiceRequest } = useServiceQueries();

  // Delete attachment
  const deleteAttachmentMutation = useMutation({
    mutationFn: async ({ requestId, attachmentPath }: { requestId: string, attachmentPath: string }) => {
      // First delete from storage
      const { error: storageError } = await supabase.storage
        .from('service-attachments')
        .remove([attachmentPath]);

      if (storageError) throw storageError;

      // Then remove attachment info from request
      const currentRequest = await getServiceRequest(requestId);
      if (!currentRequest) {
        throw new Error("Service request not found");
      }

      const attachmentsArray = Array.isArray(currentRequest.attachments) ? currentRequest.attachments as unknown as ServiceRequestAttachment[] : [];
      const updatedAttachments = attachmentsArray.filter(att => att.path !== attachmentPath);
      
      // Convert to a plain object structure that Supabase can handle
      const attachmentsForDb = updatedAttachments.map(file => ({
        name: file.name,
        path: file.path,
        type: file.type,
        size: file.size
      }));

      const { data, error } = await supabase
        .from('service_requests')
        .update({ attachments: attachmentsForDb })
        .eq('id', requestId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-requests'] });
      toast.success("File deleted successfully");
    },
    onError: (error) => {
      logger.error('File deletion error:', error);
      toast.error("Failed to delete file");
    },
  });

  return {
    deleteAttachment: deleteAttachmentMutation.mutate,
    isDeletingAttachment: deleteAttachmentMutation.isPending
  };
};
