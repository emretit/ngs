
export type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'postponed';

export type TaskPriority = 'low' | 'medium' | 'high';

export type TaskType = 'general' | 'call' | 'meeting' | 'follow_up' | 'proposal' | 'opportunity' | 'reminder' | 'email';

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
  task_id?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  type: TaskType;
  due_date?: string;
  assigned_to?: string; 
  assignee_id?: string;
  related_item_id?: string;
  related_item_title?: string;
  related_item_type?: string;
  created_at: string;
  updated_at: string;
  subtasks?: SubTask[];
  assignee?: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
  opportunity_id?: string;
}

export interface TaskWithOverdue extends Task {
  isOverdue: boolean;
}
