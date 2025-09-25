import { TaskStatus, TaskType } from './task';

export interface ActivityTemplate {
  id: string;
  name: string;
  description?: string;
  template_data: {
    title: string;
    description?: string;
    is_important?: boolean;
    type: TaskType;
    status?: TaskStatus;
    estimated_duration?: number; // in minutes
    // Recurring settings
    is_recurring?: boolean;
    recurrence_type?: 'none' | 'daily' | 'weekly' | 'monthly' | 'custom';
    recurrence_interval?: number;
    recurrence_days?: string[];
    recurrence_day_of_month?: number;
  };
  is_public: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  company_id: string;
  usage_count: number;
}

export interface CreateTemplateData {
  name: string;
  description?: string;
  template_data: ActivityTemplate['template_data'];
  is_public?: boolean;
}

export interface TemplateCategory {
  id: string;
  name: string;
  description?: string;
  templates: ActivityTemplate[];
}

// Predefined template categories
export const DEFAULT_TEMPLATE_CATEGORIES = {
  SALES: 'Satış',
  SERVICE: 'Servis',
  GENERAL: 'Genel',
  FOLLOW_UP: 'Takip',
  MEETING: 'Toplantı',
} as const;