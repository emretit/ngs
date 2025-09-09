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

// Declare module for wx-react-gantt if types are missing
declare module 'wx-react-gantt' {
  export interface Task {
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

  export enum ViewMode {
    Day = 'Day',
    Week = 'Week',
    Month = 'Month'
  }

  export interface GanttProps {
    tasks: Task[];
    viewMode: ViewMode;
    onDateChange?: (task: Task) => void;
    onTaskSelect?: (task: Task) => void;
    onTaskDelete?: (task: Task) => void;
    listCellWidth?: string;
    ganttHeight?: number;
    columnWidth?: number;
    locale?: string;
  }

  export const Gantt: React.ComponentType<GanttProps>;
}
