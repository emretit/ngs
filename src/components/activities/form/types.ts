
import { TaskStatus, TaskType } from "@/types/task";

export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly' | 'custom';

export interface FormValues {
  title: string;
  description: string;
  status: TaskStatus;
  is_important?: boolean;
  type: TaskType;
  assignee_id?: string;
  due_date?: Date;
  related_item_id?: string;
  related_item_type?: string;
  related_item_title?: string;
  // Recurring task fields
  is_recurring?: boolean;
  recurrence_type?: RecurrenceType;
  recurrence_interval?: number; // For custom intervals (every X days/weeks)
  recurrence_end_date?: Date;
  recurrence_days?: string[]; // For weekly recurrence: ['monday', 'wednesday']
  recurrence_day_of_month?: number; // For monthly recurrence: 15th of each month
}

export interface TaskFormProps {
  task?: {
    id: string;
    title: string;
    description?: string;
    status: TaskStatus;
    is_important?: boolean;
    type: TaskType;
    assignee_id?: string;
    due_date?: string;
    related_item_id?: string;
    related_item_type?: string;
    related_item_title?: string;
    // Recurring task fields
    is_recurring?: boolean;
    recurrence_type?: RecurrenceType;
    recurrence_interval?: number;
    recurrence_end_date?: string;
    recurrence_days?: string[];
    recurrence_day_of_month?: number;
  };
  onClose: () => void;
}
