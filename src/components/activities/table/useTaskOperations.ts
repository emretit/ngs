
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Task } from "@/types/task";

export const useTaskOperations = () => {
  const queryClient = useQueryClient();

  const updateTaskStatus = useMutation({
    mutationFn: async (data: { taskId: string; status: Task['status'] }) => {
      const { data: updatedTask, error } = await supabase
        .from("activities")
        .update({ status: data.status })
        .eq("id", data.taskId)
        .select()
        .single();

      if (error) throw error;
      return updatedTask;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      toast.success("Görev durumu güncellendi");
    },
    onError: (error) => {
      console.error("Error updating task status:", error);
      toast.error("Görev durumu güncellenemedi");
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
      toast.success("Görev silindi");
    },
    onError: (error) => {
      console.error("Error deleting task:", error);
      toast.error("Görev silinemedi");
    },
  });

  const toggleTaskImportant = useMutation({
    mutationFn: async (data: { taskId: string; is_important: boolean }) => {
      const { data: updatedTask, error } = await supabase
        .from("activities")
        .update({ is_important: data.is_important })
        .eq("id", data.taskId)
        .select()
        .single();

      if (error) throw error;
      return updatedTask;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      toast.success("Görev önemi güncellendi");
    },
    onError: (error) => {
      console.error("Error updating task importance:", error);
      toast.error("Görev önemi güncellenemedi");
    },
  });

  return {
    updateTaskStatus: (taskId: string, status: Task['status']) => 
      updateTaskStatus.mutate({ taskId, status }),
    toggleTaskImportant: (taskId: string, is_important: boolean) =>
      toggleTaskImportant.mutate({ taskId, is_important }),
    deleteTask: (taskId: string) => deleteTask.mutate(taskId),
  };
};
