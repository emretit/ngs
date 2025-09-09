
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toastUtils";
import { FormValues } from "./types";

export const useTaskFormMutations = (onClose: () => void, taskId?: string) => {
  const queryClient = useQueryClient();

  const createTaskMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      

      // Format the data for the API
      const taskData = {
        title: data.title,
        description: data.description || null,
        status: data.status,
        priority: data.priority,
        type: data.type,
        assignee_id: data.assignee_id || null,
        due_date: data.due_date ? data.due_date.toISOString() : null,
        related_item_id: data.related_item_id || null,
        related_item_type: data.related_item_type || null,
        related_item_title: data.related_item_title || null,
        project_id: '00000000-0000-0000-0000-0000-000000000001'
      };

      const { data: newTask, error } = await supabase
        .from("activities")
        .insert(taskData)
        .select()
        .single();

      if (error) throw error;
      return newTask;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      showSuccess("Aktivite başarıyla oluşturuldu");
      onClose();
    },
    onError: (error) => {
      console.error("Error creating task:", error);
      showError("Aktivite oluşturulurken bir hata oluştu");
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      if (!taskId) throw new Error("Task is required for update");

      // Format the data for the API
      const taskData = {
        title: data.title,
        description: data.description || null,
        status: data.status,
        priority: data.priority,
        type: data.type,
        assignee_id: data.assignee_id || null,
        due_date: data.due_date ? data.due_date.toISOString() : null,
        related_item_id: data.related_item_id || null,
        related_item_type: data.related_item_type || null,
        related_item_title: data.related_item_title || null,
      };

      const { data: updatedTask, error } = await supabase
        .from("activities")
        .update(taskData)
        .eq("id", taskId)
        .select()
        .single();

      if (error) throw error;
      return updatedTask;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      showSuccess("Aktivite başarıyla güncellendi");
      onClose();
    },
    onError: (error) => {
      console.error("Error updating task:", error);
      showError("Aktivite güncellenirken bir hata oluştu");
    },
  });

  return {
    createTaskMutation,
    updateTaskMutation
  };
};
