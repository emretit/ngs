
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { Task } from "@/types/task";
import { FormValues, TaskFormProps } from "./form/types";
import TaskBasicInfo from "./form/TaskBasicInfo";
import TaskMetadata from "./form/TaskMetadata";
import TaskAssignment from "./form/TaskAssignment";
import TaskRelatedItem from "./form/TaskRelatedItem";
import FormActions from "./form/FormActions";
import { useTaskFormMutations } from "./form/useTaskFormMutations";

export default function TaskForm({ task, onClose }: TaskFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register, handleSubmit, formState: { errors }, setValue, watch, reset } = useForm<FormValues>({
    defaultValues: {
      title: task?.title || "",
      description: task?.description || "",
      status: task?.status || "todo",
      priority: task?.priority || "medium",
      type: task?.type || "general",
      assignee_id: task?.assignee_id || undefined,
      due_date: task?.due_date ? new Date(task.due_date) : undefined,
      related_item_id: task?.related_item_id || undefined,
      related_item_type: task?.related_item_type || undefined,
      related_item_title: task?.related_item_title || undefined,
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
          {task ? "Görevi Düzenle" : "Yeni Görev"}
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
      </div>
      
      <FormActions 
        onClose={onClose} 
        isEditing={!!task} 
        isSubmitting={isSubmitting} 
      />
    </form>
  );
}
