import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import type { Task } from "@/types/task";
import { EditableDetailSheet, FieldConfig } from "@/components/common/EditableDetailSheet";

interface TaskDetailSheetProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
}

// Validation schema
const taskSchema = z.object({
  description: z.string().optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

const TaskDetailSheet = ({ task, isOpen, onClose }: TaskDetailSheetProps) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // Update mutation
  const updateTaskMutation = useMutation({
    mutationFn: async (values: TaskFormData) => {
      if (!task?.id) throw new Error('Task ID is required');

      const { data, error } = await supabase
        .from('activities')
        .update(values)
        .eq('id', task.id)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      toast.success(t('toast.activityUpdated'));
    },
    onError: (error) => {
      toast.error(t('toast.activityUpdateError'));
      console.error('Update error:', error);
    }
  });

  // Form fields configuration
  const fields: FieldConfig<TaskFormData>[] = [
    {
      name: 'description',
      label: t("forms.addDescription"),
      type: 'textarea',
      placeholder: t("forms.addDescription"),
      gridColumn: 'col-span-full',
    },
  ];

  const handleSave = async (values: TaskFormData) => {
    await updateTaskMutation.mutateAsync(values);
  };

  return (
    <EditableDetailSheet
      isOpen={isOpen}
      onClose={onClose}
      title={t("activities.title")}
      subtitle={task?.title}
      data={task as TaskFormData}
      fields={fields}
      schema={taskSchema}
      onSave={handleSave}
      isSaving={updateTaskMutation.isPending}
      saveButtonText={t("common.save")}
      cancelButtonText={t("common.cancel")}
      size="md"
    />
  );
};

export default TaskDetailSheet;
