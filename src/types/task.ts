export type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'postponed';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

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
  order_rank?: string;
}

export interface TaskWithOverdue extends Task {
  isOverdue: boolean;
}

export interface TaskFilters {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  assigneeId?: string[];
  dueDateRange?: {
    start: Date;
    end: Date;
  };
  onlyMine?: boolean;
}

export interface TaskBoard {
  todo: TaskWithOverdue[];
  in_progress: TaskWithOverdue[];
  completed: TaskWithOverdue[];
  postponed: TaskWithOverdue[];
}