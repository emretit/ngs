
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { logger } from '@/utils/logger';
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
    onMutate: async (data) => {
      // Optimistic update - hemen UI'ı güncelle
      await queryClient.cancelQueries({ queryKey: ["activities"] });
      await queryClient.cancelQueries({ queryKey: ["activities-infinite"] });

      // Önceki state'i sakla (rollback için)
      const previousActivities = queryClient.getQueriesData({ queryKey: ["activities"] });
      const previousInfinite = queryClient.getQueriesData({ queryKey: ["activities-infinite"] });

      // Tüm activity query'lerini güncelle (normal query)
      queryClient.setQueriesData<Task[]>(
        { queryKey: ["activities"] },
        (old) => {
          if (!old) return old;
          return old.map((task) =>
            task.id === data.taskId
              ? { ...task, status: data.status }
              : task
          );
        }
      );

      // Infinite scroll query'lerini güncelle
      queryClient.setQueriesData(
        { queryKey: ["activities-infinite"] },
        (old: any) => {
          if (!old) return old;
          // Infinite query data structure: { pages: [...], pageParams: [...] }
          if (old.pages) {
            return {
              ...old,
              pages: old.pages.map((page: any) => ({
                ...page,
                data: (page.data || []).map((task: Task) =>
                  task.id === data.taskId
                    ? { ...task, status: data.status }
                    : task
                ),
              })),
            };
          }
          // Eğer düz array ise
          if (Array.isArray(old)) {
            return old.map((task: Task) =>
              task.id === data.taskId
                ? { ...task, status: data.status }
                : task
            );
          }
          return old;
        }
      );

      return { previousActivities, previousInfinite };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      queryClient.invalidateQueries({ queryKey: ["activities-infinite"] });
      toast.success("Görev durumu güncellendi");
    },
    onError: (error, variables, context) => {
      // Hata durumunda önceki state'e geri dön
      if (context?.previousActivities) {
        context.previousActivities.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      if (context?.previousInfinite) {
        context.previousInfinite.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      logger.error("Error updating task status:", error);
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
      logger.error("Error deleting task:", error);
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
      logger.error("Error updating task importance:", error);
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
