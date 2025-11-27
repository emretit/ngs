/**
 * Service recurrence utility functions
 */

export type RecurrenceType = 'daily' | 'weekly' | 'monthly' | 'none';

export interface RecurrenceConfig {
  type: RecurrenceType;
  interval?: number;
  endDate?: Date;
  days?: number[]; // For weekly: [1,3,5] = Monday, Wednesday, Friday
  dayOfMonth?: number; // For monthly: 1-31
}

export interface RecurrenceInstance {
  date: Date;
  isLast?: boolean;
}

/**
 * Calculate next recurrence date
 */
export function calculateNextRecurrenceDate(
  baseDate: Date,
  config: RecurrenceConfig
): Date | null {
  if (config.type === 'none' || !config.type) {
    return null;
  }

  const interval = config.interval || 1;
  let nextDate = new Date(baseDate);

  switch (config.type) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + interval);
      break;

    case 'weekly':
      if (config.days && config.days.length > 0) {
        // Find next occurrence based on specified days
        for (let i = 1; i <= 7; i++) {
          nextDate.setDate(nextDate.getDate() + 1);
          const dayOfWeek = nextDate.getDay() === 0 ? 7 : nextDate.getDay(); // Monday = 1, Sunday = 7
          if (config.days.includes(dayOfWeek)) {
            break;
          }
        }
      } else {
        nextDate.setDate(nextDate.getDate() + (interval * 7));
      }
      break;

    case 'monthly':
      if (config.dayOfMonth) {
        nextDate.setMonth(nextDate.getMonth() + interval);
        // Set to specific day of month
        const daysInMonth = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate();
        nextDate.setDate(Math.min(config.dayOfMonth, daysInMonth));
      } else {
        nextDate.setMonth(nextDate.getMonth() + interval);
      }
      break;

    default:
      return null;
  }

  // Check if we've exceeded the end date
  if (config.endDate && nextDate > config.endDate) {
    return null;
  }

  return nextDate;
}

/**
 * Generate recurrence instances up to a certain date
 */
export function generateRecurrenceInstances(
  startDate: Date,
  config: RecurrenceConfig,
  maxDate: Date,
  maxInstances: number = 50
): RecurrenceInstance[] {
  const instances: RecurrenceInstance[] = [];
  let currentDate = new Date(startDate);
  let count = 0;

  while (count < maxInstances && currentDate <= maxDate) {
    if (config.endDate && currentDate > config.endDate) {
      break;
    }

    instances.push({
      date: new Date(currentDate),
      isLast: config.endDate ? currentDate.getTime() === config.endDate.getTime() : false,
    });

    const nextDate = calculateNextRecurrenceDate(currentDate, config);
    if (!nextDate) {
      break;
    }

    currentDate = nextDate;
    count++;
  }

  return instances;
}

/**
 * Get human-readable recurrence description
 */
export function getRecurrenceDescription(config: RecurrenceConfig): string {
  if (config.type === 'none' || !config.type) {
    return 'Tekrarlanmıyor';
  }

  const interval = config.interval || 1;

  switch (config.type) {
    case 'daily':
      if (interval === 1) {
        return 'Her gün';
      }
      return `Her ${interval} günde bir`;

    case 'weekly':
      if (config.days && config.days.length > 0) {
        const dayNames = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
        const selectedDays = config.days
          .map(d => dayNames[d === 7 ? 0 : d])
          .join(', ');
        return `Her hafta ${selectedDays}`;
      }
      if (interval === 1) {
        return 'Her hafta';
      }
      return `Her ${interval} haftada bir`;

    case 'monthly':
      if (config.dayOfMonth) {
        if (interval === 1) {
          return `Her ayın ${config.dayOfMonth}'i`;
        }
        return `Her ${interval} ayda bir, ayın ${config.dayOfMonth}'i`;
      }
      if (interval === 1) {
        return 'Her ay';
      }
      return `Her ${interval} ayda bir`;

    default:
      return 'Bilinmeyen';
  }
}

/**
 * Check if a date matches the recurrence pattern
 */
export function matchesRecurrencePattern(
  date: Date,
  startDate: Date,
  config: RecurrenceConfig
): boolean {
  if (config.type === 'none' || !config.type) {
    return false;
  }

  // Check if date is before start date
  if (date < startDate) {
    return false;
  }

  // Check if date is after end date
  if (config.endDate && date > config.endDate) {
    return false;
  }

  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const startOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const diffDays = Math.floor((dateOnly.getTime() - startOnly.getTime()) / (1000 * 60 * 60 * 24));

  switch (config.type) {
    case 'daily':
      return diffDays % (config.interval || 1) === 0;

    case 'weekly':
      if (config.days && config.days.length > 0) {
        const dayOfWeek = date.getDay() === 0 ? 7 : date.getDay();
        return config.days.includes(dayOfWeek);
      }
      return diffDays % ((config.interval || 1) * 7) === 0;

    case 'monthly':
      if (config.dayOfMonth) {
        return date.getDate() === config.dayOfMonth;
      }
      // Check if it's the same day of month
      return startDate.getDate() === date.getDate() && 
             diffDays % ((config.interval || 1) * 30) < 31;

    default:
      return false;
  }
}







