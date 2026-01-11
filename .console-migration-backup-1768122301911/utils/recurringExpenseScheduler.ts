import { addDays, addWeeks, addMonths, format, isAfter, startOfDay } from 'date-fns';
import { tr } from 'date-fns/locale';

export type RecurrenceType = 'daily' | 'weekly' | 'monthly' | 'none';

export interface RecurringExpenseConfig {
  recurrence_type: RecurrenceType;
  recurrence_end_date?: Date;
  recurrence_days?: string[]; // For weekly: ['1', '3', '5'] (Monday, Wednesday, Friday)
  recurrence_day_of_month?: number; // For monthly: 15
}

export interface ExpenseInstance {
  date: Date;
  description_suffix?: string; // e.g., " (15/03/2025)"
}

/**
 * Generates the next dates for a recurring expense
 * @param startDate - The initial expense date
 * @param config - Recurrence configuration
 * @returns Array of expense instances (generates all instances until end date, no limit)
 */
export function generateRecurringExpenses(
  startDate: Date,
  config: RecurringExpenseConfig
): ExpenseInstance[] {
  const instances: ExpenseInstance[] = [];
  let currentDate = startOfDay(startDate);

  // Add the initial expense (not recurring instance)
  instances.push({
    date: currentDate,
    description_suffix: undefined
  });

  if (config.recurrence_type === 'none' || !config.recurrence_type) {
    return instances;
  }

  // Safety limit to prevent infinite loops (e.g., 10 years worth of daily = ~3650 instances)
  const SAFETY_LIMIT = 5000;
  let count = 1;

  while (count < SAFETY_LIMIT) {
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

      default:
        break;
    }

    if (!nextDate!) break;

    // Check if we've exceeded the end date - if no end date, use safety limit
    if (config.recurrence_end_date) {
      if (isAfter(nextDate, config.recurrence_end_date)) {
        break;
      }
    }

    instances.push({
      date: nextDate,
      description_suffix: ` (${format(nextDate, 'dd/MM/yyyy', { locale: tr })})`
    });

    currentDate = nextDate;
    count++;
  }

  // Warn if we hit the safety limit
  if (count >= SAFETY_LIMIT) {
    console.warn('Recurring expense generation hit safety limit of', SAFETY_LIMIT, 'instances. Consider setting an end date.');
  }

  return instances;
}

/**
 * Gets the next date for weekly recurrence based on specified days
 * Days are represented as numbers: 1=Monday, 2=Tuesday, ..., 7=Sunday
 */
function getNextWeeklyDate(currentDate: Date, recurrenceDays: string[]): Date {
  const currentDayIndex = currentDate.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday

  // Convert to our format (1=Monday, 7=Sunday)
  const currentDayNumber = currentDayIndex === 0 ? 7 : currentDayIndex;

  // Convert recurrence days to numbers and sort
  const targetDays = recurrenceDays
    .map(day => parseInt(day))
    .filter(day => !isNaN(day) && day >= 1 && day <= 7)
    .sort((a, b) => a - b);

  if (targetDays.length === 0) {
    return addWeeks(currentDate, 1);
  }

  // Find the next occurrence
  let nextDay = targetDays.find(day => day > currentDayNumber);

  if (nextDay === undefined) {
    // No more days this week, move to next week's first day
    nextDay = targetDays[0];
    const daysToAdd = (7 - currentDayNumber) + nextDay;
    return addDays(currentDate, daysToAdd);
  } else {
    // Next day is this week
    const daysToAdd = nextDay - currentDayNumber;
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
 * Gets a human-readable description of the recurrence pattern
 */
export function getRecurrenceDescription(config: RecurringExpenseConfig): string {
  const { recurrence_type, recurrence_days, recurrence_day_of_month, recurrence_end_date } = config;

  let description = '';

  switch (recurrence_type) {
    case 'daily':
      description = 'Her gün';
      break;

    case 'weekly':
      if (recurrence_days && recurrence_days.length > 0) {
        const dayNames = {
          '1': 'Pazartesi',
          '2': 'Salı',
          '3': 'Çarşamba',
          '4': 'Perşembe',
          '5': 'Cuma',
          '6': 'Cumartesi',
          '7': 'Pazar'
        };
        const dayLabels = recurrence_days.map(day => dayNames[day as keyof typeof dayNames]).join(', ');
        description = `Her hafta ${dayLabels}`;
      } else {
        description = 'Her hafta';
      }
      break;

    case 'monthly':
      const dayOfMonth = recurrence_day_of_month || 1;
      description = `Her ayın ${dayOfMonth}. günü`;
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
 * Creates the next instance of a recurring expense
 */
export function createNextExpenseInstance(
  baseExpense: any,
  nextDate: Date,
  descriptionSuffix?: string
): any {
  return {
    ...baseExpense,
    id: undefined, // Will be generated by database
    date: format(nextDate, 'yyyy-MM-dd'),
    description: baseExpense.description + (descriptionSuffix || ''),
    is_recurring_instance: true,
    parent_expense_id: baseExpense.id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}
