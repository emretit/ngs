
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toastUtils";
import { FormValues } from "./types";
import { generateRecurringTasks, createNextTaskInstance } from "@/utils/recurringTaskScheduler";

export const useTaskFormMutations = (onClose: () => void, taskId?: string) => {
  const queryClient = useQueryClient();

  // Helper function to generate recurring task instances
  const handleRecurringTaskGeneration = async (parentTask: any, formData: FormValues) => {
    try {
      const instances = generateRecurringTasks(
        formData.due_date!,
        {
          recurrence_type: formData.recurrence_type!,
          recurrence_interval: formData.recurrence_interval,
          recurrence_end_date: formData.recurrence_end_date,
          recurrence_days: formData.recurrence_days,
          recurrence_day_of_month: formData.recurrence_day_of_month,
        },
        20 // Generate up to 20 future instances
      );

      // Skip the first instance (it's the parent task we just created)
      const futureInstances = instances.slice(1);

      if (futureInstances.length > 0) {
        const tasksToInsert = futureInstances.map(instance =>
          createNextTaskInstance(parentTask, instance.due_date, instance.title_suffix)
        );

        const { error: batchError } = await supabase
          .from("activities")
          .insert(tasksToInsert);

        if (batchError) {
          console.error("Error creating recurring task instances:", batchError);
        }
      }
    } catch (error) {
      console.error("Error generating recurring tasks:", error);
    }
  };

  const createTaskMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      

      // Format the data for the API
      const taskData = {
        title: data.title,
        description: data.description || null,
        status: data.status,
        is_important: data.is_important || false,
        type: data.type,
        assignee_id: data.assignee_id || null,
        due_date: data.due_date ? data.due_date.toISOString() : null,
        related_item_id: data.related_item_id || null,
        related_item_type: data.related_item_type || null,
        related_item_title: data.related_item_title || null,
        project_id: '00000000-0000-0000-0000-0000-000000000001',
        // Recurring task fields
        is_recurring: data.is_recurring || false,
        recurrence_type: data.recurrence_type || 'none',
        recurrence_interval: data.recurrence_interval || null,
        recurrence_end_date: data.recurrence_end_date ? data.recurrence_end_date.toISOString() : null,
        recurrence_days: data.recurrence_days || null,
        recurrence_day_of_month: data.recurrence_day_of_month || null,
      };

      const { data: newTask, error } = await supabase
        .from("activities")
        .insert(taskData)
        .select()
        .single();

      if (error) throw error;

      // If this is a recurring task, generate future instances
      if (data.is_recurring && data.recurrence_type !== 'none' && data.due_date) {
        await handleRecurringTaskGeneration(newTask, data);
      }

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
        is_important: data.is_important || false,
        type: data.type,
        assignee_id: data.assignee_id || null,
        due_date: data.due_date ? data.due_date.toISOString() : null,
        related_item_id: data.related_item_id || null,
        related_item_type: data.related_item_type || null,
        related_item_title: data.related_item_title || null,
        // Recurring task fields
        is_recurring: data.is_recurring || false,
        recurrence_type: data.recurrence_type || 'none',
        recurrence_interval: data.recurrence_interval || null,
        recurrence_end_date: data.recurrence_end_date ? data.recurrence_end_date.toISOString() : null,
        recurrence_days: data.recurrence_days || null,
        recurrence_day_of_month: data.recurrence_day_of_month || null,
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
