
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toastUtils";
import { Task } from "@/types/task";

export const useTaskMutations = () => {
  const queryClient = useQueryClient();

  const updateTask = useMutation({
    mutationFn: async (data: Partial<Task>) => {
      if (!data.id) throw new Error("Task ID is required");

      const { data: updatedTask, error } = await supabase
        .from("activities")
        .update(data)
        .eq("id", data.id)
        .select()
        .single();

      if (error) throw error;
      return updatedTask;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      showSuccess("Task updated successfully");
    },
    onError: (error) => {
      console.error("Error updating task:", error);
      showError("Failed to update task");
    },
  });

  const deleteTask = useMutation({
    mutationFn: async (taskId: string) => {
      const { error } = await supabase
        .from("activities")
        .delete()
        .eq("id", taskId);

      if (error) throw error;
      return taskId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      showSuccess("Task deleted successfully");
    },
    onError: (error) => {
      console.error("Error deleting task:", error);
      showError("Failed to delete task");
    },
  });

  return {
    updateTask,
    deleteTask,
  };
};
