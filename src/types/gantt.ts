// Gantt Chart Types
export interface GanttTask {
  id: string;
  name: string;
  start: Date;
  end: Date;
  progress: number;
  type: 'task' | 'project';
  project?: string;
  displayOrder: number;
  styles?: {
    backgroundColor?: string;
    progressColor?: string;
    progressSelectedColor?: string;
  };
}

export type GanttViewMode = 'Day' | 'Week' | 'Month';

export interface GanttProps {
  tasks: GanttTask[];
  viewMode: GanttViewMode;
  onDateChange?: (task: GanttTask) => void;
  onTaskSelect?: (task: GanttTask) => void;
  onTaskDelete?: (task: GanttTask) => void;
  listCellWidth?: string;
  ganttHeight?: number;
  columnWidth?: number;
  locale?: string;
}

