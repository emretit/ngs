/**
 * SLA (Service Level Agreement) utility functions
 */

export type SLAPriority = 'urgent' | 'high' | 'medium' | 'low';
export type SLAStatus = 'on_time' | 'at_risk' | 'breached';

export interface SLAConfig {
  targetHours: number;
  warningThreshold: number; // Percentage remaining before warning (default: 20%)
}

/**
 * SLA target hours based on priority
 */
export const SLA_TARGET_HOURS: Record<SLAPriority, number> = {
  urgent: 2,   // 2 hours
  high: 4,     // 4 hours
  medium: 8,   // 8 hours
  low: 24,     // 24 hours
};

/**
 * Calculate SLA target hours for a given priority
 */
export function calculateSLATargetHours(priority: SLAPriority | string): number {
  return SLA_TARGET_HOURS[priority as SLAPriority] || SLA_TARGET_HOURS.medium;
}

/**
 * Calculate SLA due time from start time and priority
 */
export function calculateSLADueTime(startTime: Date, priority: SLAPriority | string): Date {
  const targetHours = calculateSLATargetHours(priority);
  const dueTime = new Date(startTime);
  dueTime.setHours(dueTime.getHours() + targetHours);
  return dueTime;
}

/**
 * Calculate SLA status based on current time and due time
 */
export function calculateSLAStatus(
  startTime: Date | null,
  dueTime: Date | null,
  currentTime: Date = new Date()
): SLAStatus | null {
  if (!startTime || !dueTime) {
    return null;
  }

  const totalDuration = dueTime.getTime() - startTime.getTime();
  const elapsed = currentTime.getTime() - startTime.getTime();
  const remaining = dueTime.getTime() - currentTime.getTime();
  
  const percentRemaining = (remaining / totalDuration) * 100;

  if (remaining < 0) {
    return 'breached';
  } else if (percentRemaining <= 20) {
    return 'at_risk';
  } else {
    return 'on_time';
  }
}

/**
 * Get time remaining until SLA deadline
 */
export function getSLATimeRemaining(dueTime: Date | null, currentTime: Date = new Date()): {
  hours: number;
  minutes: number;
  totalMinutes: number;
  isOverdue: boolean;
} | null {
  if (!dueTime) {
    return null;
  }

  const diff = dueTime.getTime() - currentTime.getTime();
  const totalMinutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const isOverdue = diff < 0;

  return {
    hours: Math.abs(hours),
    minutes: Math.abs(minutes),
    totalMinutes: Math.abs(totalMinutes),
    isOverdue,
  };
}

/**
 * Get human-readable SLA status label
 */
export function getSLAStatusLabel(status: SLAStatus | null): string {
  switch (status) {
    case 'on_time':
      return 'Zamanında';
    case 'at_risk':
      return 'Risk Altında';
    case 'breached':
      return 'İhlal Edildi';
    default:
      return 'Belirlenmemiş';
  }
}

/**
 * Get color for SLA status
 */
export function getSLAStatusColor(status: SLAStatus | null): string {
  switch (status) {
    case 'on_time':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'at_risk':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'breached':
      return 'text-red-600 bg-red-50 border-red-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
}

/**
 * Format time remaining as human-readable string
 */
export function formatSLATimeRemaining(timeRemaining: {
  hours: number;
  minutes: number;
  totalMinutes: number;
  isOverdue: boolean;
} | null): string {
  if (!timeRemaining) {
    return 'SLA belirlenmemiş';
  }

  if (timeRemaining.isOverdue) {
    return `${timeRemaining.hours}s ${timeRemaining.minutes}dk geçti`;
  }

  if (timeRemaining.hours > 0) {
    return `${timeRemaining.hours}s ${timeRemaining.minutes}dk kaldı`;
  } else {
    return `${timeRemaining.minutes}dk kaldı`;
  }
}

/**
 * Check if SLA should trigger a warning notification
 */
export function shouldTriggerSLAWarning(
  status: SLAStatus | null,
  timeRemaining: { totalMinutes: number; isOverdue: boolean } | null,
  warningThresholdMinutes: number = 60 // Default: 1 hour
): boolean {
  if (!status || !timeRemaining) {
    return false;
  }

  if (status === 'breached' || timeRemaining.isOverdue) {
    return true;
  }

  if (status === 'at_risk' && timeRemaining.totalMinutes <= warningThresholdMinutes) {
    return true;
  }

  return false;
}




