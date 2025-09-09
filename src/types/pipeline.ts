
import { Task } from "./task";
import { Deal } from "./deal";

export type PipelineView = 'tasks' | 'deals' | 'unified';
export type ItemType = 'task' | 'deal' | 'opportunity';

export interface PipelineColumn {
  id: string;
  name: string;
}

export interface PipelineFilter {
  employeeId?: string;
  customerName?: string;
  status?: string[];
  priority?: string[];
}

// Extend the Deal type to include item_type for pipeline compatibility
export interface PipelineDeal extends Deal {
  item_type: 'deal';
}

// Union type for all pipeline items
export type PipelineItem = Task | PipelineDeal;
