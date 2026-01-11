
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { logger } from '@/utils/logger';
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toastUtils";
import type { Task } from "@/types/task";

export const useTaskDetail = () => {
  const queryClient = useQueryClient();

  const updateTaskMutation = useMutation({
    mutationFn: async (updatedTask: Omit<Task, 'subtasks'>) => {
      
      // Only send the fields we want to update to avoid type errors
      const taskForUpdate = {
        id: updatedTask.id,
        title: updatedTask.title,
        description: updatedTask.description,
        status: updatedTask.status,
        type: updatedTask.type || 'general',
        due_date: updatedTask.due_date,
        assignee_id: updatedTask.assignee_id,
        related_item_id: updatedTask.related_item_id,
        related_item_title: updatedTask.related_item_title,
        related_item_type: updatedTask.related_item_type
        // subtasks are handled separately in the component
      };
      
      const { data, error } = await supabase
        .from("activities")
        .update(taskForUpdate)
        .eq("id", updatedTask.id)
        .select()
        .single();

      if (error) {
        logger.error("Error updating task:", error);
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      showSuccess('Görev başarıyla güncellendi', { duration: 1000 });
    },
    onError: (error) => {
      logger.error("Mutation error:", error);
      showError('Görev güncellenirken hata oluştu: ' + error.message);
    }
  });

  return {
    updateTaskMutation
  };
};
