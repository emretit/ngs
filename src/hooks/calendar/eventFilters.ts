import { EventType } from '@/components/calendar/types';

// Event filtering utilities
export const shouldIncludeEvent = (
  eventType: EventType,
  eventFilters: Record<EventType, { enabled: boolean; color?: string }>
): boolean => {
  return eventFilters[eventType]?.enabled !== false;
};

