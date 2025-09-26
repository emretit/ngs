export type TaskStatus = "todo" | "in_progress" | "completed" | "postponed";
export type TaskType = "general" | "opportunity" | "proposal" | "service" | "call" | "meeting" | "follow_up" | "reminder" | "email";
export type TaskPriority = "low" | "medium" | "high";

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority?: TaskPriority;
  is_important?: boolean;
  type: TaskType;
  assignee_id?: string;
  assignee?: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
  due_date?: string;
  created_at: string;
  updated_at: string;
  company_id: string;
  related_item_id?: string;
  related_item_type?: string;
  related_item_title?: string;
  subtasks?: SubTask[];

  // Recurring task fields
  is_recurring?: boolean;
  recurrence_type?: 'none' | 'daily' | 'weekly' | 'monthly' | 'custom';
  recurrence_interval?: number;
  recurrence_end_date?: string;
  recurrence_days?: string[];
  recurrence_day_of_month?: number;
  parent_task_id?: string; // For recurring task instances
  is_recurring_instance?: boolean; // True if this is a generated instance
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
  task_id: string;
  created_at: string;
}

export interface TaskWithOverdue extends Task {
  isOverdue: boolean;
}