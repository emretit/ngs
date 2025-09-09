
import type { Task } from "./task";

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  resource: Task;
  status: string;
  priority: string;
}
