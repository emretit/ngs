
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { FormValues, TaskFormProps } from "./types";
import TaskBasicInfo from "./TaskBasicInfo";
import TaskMetadata from "./TaskMetadata";
import TaskAssignment from "./TaskAssignment";
import TaskRelatedItem from "./TaskRelatedItem";
import TaskRecurrence from "./TaskRecurrence";
import FormActions from "./FormActions";
import { useTaskFormMutations } from "./useTaskFormMutations";

export default function TaskForm({ task, onClose }: TaskFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register, handleSubmit, formState: { errors }, setValue, watch, reset } = useForm<FormValues>({
    defaultValues: {
      title: task?.title || "",
      description: task?.description || "",
      status: task?.status || "todo",
      is_important: task?.is_important || false,
      type: task?.type || "general",
      assignee_id: task?.assignee_id || undefined,
      due_date: task?.due_date ? new Date(task.due_date) : undefined,
      related_item_id: task?.related_item_id || undefined,
      related_item_type: task?.related_item_type || undefined,
      related_item_title: task?.related_item_title || undefined,
      // Recurring task defaults
      is_recurring: task?.is_recurring || false,
      recurrence_type: task?.recurrence_type || 'none',
      recurrence_interval: task?.recurrence_interval || 1,
      recurrence_end_date: task?.recurrence_end_date ? new Date(task.recurrence_end_date) : undefined,
      recurrence_days: task?.recurrence_days || [],
      recurrence_day_of_month: task?.recurrence_day_of_month || 1,
    }
  });

  const { createTaskMutation, updateTaskMutation } = useTaskFormMutations(onClose, task?.id);

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      if (task) {
        await updateTaskMutation.mutateAsync(data);
      } else {
        await createTaskMutation.mutateAsync(data);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-4">
          {task ? "Aktiviteyi Düzenle" : "Yeni Aktivite"}
        </h2>
      </div>
      
      <div className="space-y-4">
        <TaskBasicInfo 
          register={register} 
          errors={errors} 
          watch={watch} 
          setValue={setValue} 
        />
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TaskMetadata 
            watch={watch} 
            setValue={setValue} 
            errors={errors}
          />
        </div>
        
        <TaskAssignment 
          watch={watch} 
          setValue={setValue} 
        />

        <TaskRelatedItem
          watch={watch}
          setValue={setValue}
        />

        <TaskRecurrence
          watch={watch}
          setValue={setValue}
        />
      </div>
      
      <FormActions 
        onClose={onClose} 
        isEditing={!!task} 
        isSubmitting={isSubmitting} 
      />
    </form>
  );
}
