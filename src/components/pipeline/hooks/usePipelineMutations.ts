
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toastUtils";
import type { Task } from "@/types/task";
import type { Deal } from "@/types/deal";

export const usePipelineMutations = () => {
  const queryClient = useQueryClient();

  // Task status update mutation
  const updateTaskStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Task['status'] }) => {
      const { error } = await supabase
        .from('activities')
        .update({ status })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      showSuccess('Task status updated successfully');
    },
    onError: (error) => {
      showError('Error updating task status');
      console.error('Error updating task:', error);
    }
  });

  // Deal status update mutation
  const updateDealStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Deal['status'] }) => {
      // This would be a real Supabase query in production
      console.log(`Updating deal ${id} status to ${status}`);
      // Simulate a delay
      await new Promise(resolve => setTimeout(resolve, 500));
      // In production, this would be:
      // const { error } = await supabase
      //   .from('deals')
      //   .update({ status })
      //   .eq('id', id);
      // if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      showSuccess('Deal status updated successfully');
    },
    onError: (error) => {
      showError('Error updating deal status');
      console.error('Error updating deal:', error);
    }
  });

  return {
    updateTaskStatusMutation,
    updateDealStatusMutation
  };
};
