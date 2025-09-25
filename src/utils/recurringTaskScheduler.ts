import { addDays, addWeeks, addMonths, format, isAfter, isSameDay, startOfDay } from 'date-fns';
import { tr } from 'date-fns/locale';
import { RecurrenceType } from '@/components/activities/form/types';

export interface RecurringTaskConfig {
  recurrence_type: RecurrenceType;
  recurrence_interval?: number;
  recurrence_end_date?: Date;
  recurrence_days?: string[]; // For weekly: ['monday', 'wednesday']
  recurrence_day_of_month?: number; // For monthly: 15
}

export interface TaskInstance {
  due_date: Date;
  title_suffix?: string; // e.g., "(2024-12-25)"
}

/**
 * Generates the next due dates for a recurring task
 * @param startDate - The initial due date
 * @param config - Recurrence configuration
 * @param maxInstances - Maximum number of instances to generate (default: 50)
 * @returns Array of task instances
 */
export function generateRecurringTasks(
  startDate: Date,
  config: RecurringTaskConfig,
  maxInstances: number = 50
): TaskInstance[] {
  const instances: TaskInstance[] = [];
  let currentDate = startOfDay(startDate);

  // Add the initial task (not recurring instance)
  instances.push({
    due_date: currentDate,
    title_suffix: undefined
  });

  if (config.recurrence_type === 'none' || !config.recurrence_type) {
    return instances;
  }

  let count = 1;
  while (count < maxInstances) {
    let nextDate: Date;

    switch (config.recurrence_type) {
      case 'daily':
        nextDate = addDays(currentDate, 1);
        break;

      case 'weekly':
        if (config.recurrence_days && config.recurrence_days.length > 0) {
          nextDate = getNextWeeklyDate(currentDate, config.recurrence_days);
        } else {
          nextDate = addWeeks(currentDate, 1);
        }
        break;

      case 'monthly':
        nextDate = getNextMonthlyDate(currentDate, config.recurrence_day_of_month || 1);
        break;

      case 'custom':
        const interval = config.recurrence_interval || 1;
        nextDate = addDays(currentDate, interval);
        break;

      default:
        break;
    }

    if (!nextDate!) break;

    // Check if we've exceeded the end date
    if (config.recurrence_end_date && isAfter(nextDate, config.recurrence_end_date)) {
      break;
    }

    instances.push({
      due_date: nextDate,
      title_suffix: ` (${format(nextDate, 'dd/MM/yyyy', { locale: tr })})`
    });

    currentDate = nextDate;
    count++;
  }

  return instances;
}

/**
 * Gets the next date for weekly recurrence based on specified days
 */
function getNextWeeklyDate(currentDate: Date, recurrenceDays: string[]): Date {
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const currentDayIndex = currentDate.getDay();

  // Convert recurrence days to day indices
  const targetDayIndices = recurrenceDays
    .map(day => dayNames.indexOf(day.toLowerCase()))
    .filter(index => index !== -1)
    .sort((a, b) => a - b);

  if (targetDayIndices.length === 0) {
    return addWeeks(currentDate, 1);
  }

  // Find the next occurrence
  let nextDayIndex = targetDayIndices.find(index => index > currentDayIndex);

  if (nextDayIndex === undefined) {
    // No more days this week, move to next week
    nextDayIndex = targetDayIndices[0];
    const daysToAdd = (7 - currentDayIndex) + nextDayIndex;
    return addDays(currentDate, daysToAdd);
  } else {
    // Next day is this week
    const daysToAdd = nextDayIndex - currentDayIndex;
    return addDays(currentDate, daysToAdd);
  }
}

/**
 * Gets the next date for monthly recurrence
 */
function getNextMonthlyDate(currentDate: Date, dayOfMonth: number): Date {
  const nextMonth = addMonths(currentDate, 1);

  // Handle edge case where the day doesn't exist in the next month (e.g., Feb 31st)
  const daysInNextMonth = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0).getDate();
  const targetDay = Math.min(dayOfMonth, daysInNextMonth);

  return new Date(nextMonth.getFullYear(), nextMonth.getMonth(), targetDay);
}

/**
 * Checks if a recurring task needs new instances generated
 */
export function shouldGenerateNewInstances(
  lastGeneratedDate: Date,
  config: RecurringTaskConfig,
  daysAhead: number = 30
): boolean {
  const futureDate = addDays(new Date(), daysAhead);

  switch (config.recurrence_type) {
    case 'daily':
      return isAfter(futureDate, addDays(lastGeneratedDate, 1));

    case 'weekly':
      return isAfter(futureDate, addWeeks(lastGeneratedDate, 1));

    case 'monthly':
      return isAfter(futureDate, addMonths(lastGeneratedDate, 1));

    case 'custom':
      const interval = config.recurrence_interval || 1;
      return isAfter(futureDate, addDays(lastGeneratedDate, interval));

    default:
      return false;
  }
}

/**
 * Gets a human-readable description of the recurrence pattern
 */
export function getRecurrenceDescription(config: RecurringTaskConfig): string {
  const { recurrence_type, recurrence_interval, recurrence_days, recurrence_day_of_month, recurrence_end_date } = config;

  let description = '';

  switch (recurrence_type) {
    case 'daily':
      description = 'Her gün';
      break;

    case 'weekly':
      if (recurrence_days && recurrence_days.length > 0) {
        const dayNames = {
          'monday': 'Pazartesi',
          'tuesday': 'Salı',
          'wednesday': 'Çarşamba',
          'thursday': 'Perşembe',
          'friday': 'Cuma',
          'saturday': 'Cumartesi',
          'sunday': 'Pazar'
        };
        const dayLabels = recurrence_days.map(day => dayNames[day as keyof typeof dayNames]).join(', ');
        description = `Her hafta ${dayLabels}`;
      } else {
        description = 'Haftalık';
      }
      break;

    case 'monthly':
      const dayOfMonth = recurrence_day_of_month || 1;
      description = `Her ayın ${dayOfMonth}. günü`;
      break;

    case 'custom':
      const interval = recurrence_interval || 1;
      description = `${interval} günde bir`;
      break;

    default:
      description = 'Tekrarlanmaz';
  }

  if (recurrence_end_date) {
    description += ` (${format(recurrence_end_date, 'dd/MM/yyyy', { locale: tr })} tarihine kadar)`;
  } else {
    description += ' (süresiz)';
  }

  return description;
}

/**
 * Creates the next instance of a recurring task
 */
export function createNextTaskInstance(
  baseTask: any,
  nextDueDate: Date,
  titleSuffix?: string
): any {
  return {
    ...baseTask,
    id: undefined, // Will be generated by database
    due_date: nextDueDate.toISOString(),
    title: baseTask.title + (titleSuffix || ''),
    status: 'todo', // Reset status for new instance
    is_recurring_instance: true,
    parent_task_id: baseTask.id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}