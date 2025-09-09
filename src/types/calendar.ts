// Define the event types and statuses as literal types
export type EventType = 'technical' | 'sales';
export type EventStatus = 'scheduled' | 'completed' | 'canceled';

// Define the filter types separately
export type EventTypeFilter = 'all' | EventType;
export type EventStatusFilter = 'all' | EventStatus;
export type TechnicianFilter = 'all' | string;

export interface Event {
  id: string;
  title: string;
  start: string;
  end: string;
  description?: string;
  event_type: EventType;
  category: string;
  status: EventStatus;
  assigned_to?: string;
  color?: string; // New field for dynamic coloring
}

export interface EventModalData {
  id?: string;
  title: string;
  start: string;
  end: string;
  description: string;
  event_type: EventType;
  category: string;
  status: EventStatus;
  assigned_to?: string;
}

export interface DbEvent {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  description: string | null;
  event_type: EventType;
  category: string;
  status: EventStatus;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

export const EVENT_CATEGORIES = {
  technical: [
    'installation',
    'maintenance',
    'repair',
    'inspection',
    'emergency'
  ]
} as const;

// Define constants for UI rendering
export const EVENT_TYPE_OPTIONS: Array<{ value: EventTypeFilter; label: string }> = [
  { value: 'all', label: 'Tümü' },
  { value: 'technical', label: 'Teknik' },
  { value: 'sales', label: 'Satış' }
];

export const EVENT_STATUS_OPTIONS: Array<{ value: EventStatusFilter; label: string }> = [
  { value: 'all', label: 'Tümü' },
  { value: 'scheduled', label: 'Planlandı' },
  { value: 'completed', label: 'Tamamlandı' },
  { value: 'canceled', label: 'İptal Edildi' }
];

// Add new types for technician colors
export const TECHNICIAN_COLORS = {
  default: '#8E9196',
  colors: [
    '#9b87f5', // Primary Purple
    '#7E69AB', // Secondary Purple
    '#F97316', // Bright Orange
    '#0EA5E9', // Ocean Blue
    '#D946EF', // Magenta Pink
    '#1EAEDB', // Bright Blue
    '#33C3F0', // Sky Blue
  ]
} as const;

export interface Technician {
  id: string;
  name: string;
  color: string;
}

export const getTechnicianColor = (technicianId: string | undefined, technicians: Technician[]): string => {
  if (!technicianId) return TECHNICIAN_COLORS.default;
  const technician = technicians.find(t => t.id === technicianId);
  return technician?.color || TECHNICIAN_COLORS.default;
};
