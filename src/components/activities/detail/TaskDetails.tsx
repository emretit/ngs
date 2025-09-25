
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Task, TaskStatus, SubTask } from "@/types/task";
import TaskMainInfo from "./TaskMainInfo";
import TaskMetadata from "./TaskMetadata";
import { SubtaskManager } from "./subtasks";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";

interface TaskDetailsProps {
  task: Task;
  onClose?: () => void;
}

const TaskDetails = ({ task, onClose }: TaskDetailsProps) => {
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState(false);
  const [formData, setFormData] = useState<Task>(task);
  const [date, setDate] = useState<Date | undefined>(
    task.due_date ? new Date(task.due_date) : undefined
  );

  const updateTaskMutation = useMutation({
    mutationFn: async (updatedTask: Omit<Task, "subtasks">) => {
      setIsUpdating(true);
      const { data, error } = await supabase
        .from("activities")
        .update(updatedTask)
        .eq("id", task.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      toast.success("Görev başarıyla güncellendi");
      if (onClose) onClose();
    },
    onError: (error) => {
      console.error("Error updating task:", error);
      toast.error("Görev güncellenirken bir hata oluştu");
    },
    onSettled: () => {
      setIsUpdating(false);
    }
  });

  const handleInputChange = (key: keyof Task, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleDateChange = (newDate: Date | undefined) => {
    setDate(newDate);
    handleInputChange('due_date', newDate?.toISOString());
  };

  const handleUpdateSubtasks = (subtasks: SubTask[]) => {
    // Note: Task type doesn't include subtasks, handle separately
    // You would typically have another mutation to update subtasks in the database
    // This is a placeholder for that functionality
    console.log("Subtasks updated:", subtasks);
  };

  const handleSave = () => {
    updateTaskMutation.mutate(formData);
  };


  return (
    <div className="space-y-6">
      <TaskMainInfo 
        formData={formData} 
        handleInputChange={handleInputChange}
      />
      <TaskMetadata 
        formData={formData}
        date={date}
        handleInputChange={handleInputChange}
        handleDateChange={handleDateChange}
      />
      <SubtaskManager 
        task={task} 
        onUpdate={handleUpdateSubtasks} 
        isUpdating={isUpdating}
      />
      
      <div className="flex justify-end space-x-2 pt-4 border-t">
        <Button 
          onClick={handleSave} 
          disabled={isUpdating}
          className="flex items-center space-x-2"
        >
          <Save className="h-4 w-4" />
          <span>{isUpdating ? "Kaydediliyor..." : "Kaydet"}</span>
        </Button>
      </div>
    </div>
  );
};

export default TaskDetails;
