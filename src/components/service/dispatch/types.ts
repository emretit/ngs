import { ServiceRequest } from "@/hooks/useServiceRequests";

export interface Technician {
  id: string;
  first_name: string;
  last_name: string;
  position?: string;
  department?: string;
  status?: string;
  user_id?: string | null;
  avatar_url?: string | null;
}

export interface DispatchTechnician extends Technician {
  todayServiceCount: number;
  weekServiceCount: number;
  status: 'available' | 'busy' | 'on-leave' | 'offline';
}

export interface TimelineService {
  service: ServiceRequest;
  startTime: Date;
  endTime: Date;
  duration: number; // dakika cinsinden
}

export interface DraggedService {
  service: ServiceRequest;
  type: 'unassigned' | 'timeline';
}

export type ViewMode = 'day' | 'week';

export interface TimeSlot {
  hour: number;
  minute: number;
  label: string;
}
