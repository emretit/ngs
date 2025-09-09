
import { TaskPriority, TaskStatus, TaskType } from "@/types/task";

export interface FormValues {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  type: TaskType;
  assignee_id?: string;
  due_date?: Date;
  related_item_id?: string;
  related_item_type?: string;
  related_item_title?: string;
}

export interface TaskFormProps {
  task?: {
    id: string;
    title: string;
    description?: string;
    status: TaskStatus;
    priority: TaskPriority;
    type: TaskType;
    assignee_id?: string;
    due_date?: string;
    related_item_id?: string;
    related_item_type?: string;
    related_item_title?: string;
  };
  onClose: () => void;
}
