/**
 * Time Tracking Service
 * PDKS-style time tracking with multiple in/out pairing, break deduction, rounding, overtime calculation
 */

import { supabase } from "@/integrations/supabase/client";

export interface PDKSLog {
  id: string;
  employee_id: string;
  log_timestamp: string;
  device_id?: string;
  terminal_id?: string;
  auth_type: string;
  direction: "in" | "out";
  location?: string;
}

export interface Shift {
  id: string;
  name: string;
  shift_type: "fixed" | "rotational" | "flexible" | "night";
  start_time: string;
  end_time: string;
  break_duration_minutes: number;
  late_tolerance_minutes: number;
  early_leave_tolerance_minutes: number;
  rounding_method: "none" | "5min" | "10min" | "15min";
  daily_overtime_threshold_hours: number;
  weekly_overtime_threshold_hours: number;
  holiday_multiplier: number;
  night_shift_start?: string;
  night_shift_end?: string;
}

export interface CalculatedTimesheet {
  first_in_time: Date | null;
  last_out_time: Date | null;
  gross_duration_minutes: number;
  break_duration_minutes: number;
  net_working_minutes: number;
  overtime_minutes: number;
  status: "normal" | "missing" | "edited" | "holiday" | "weekend" | "leave";
  is_night_shift: boolean;
}

/**
 * Round minutes based on rounding method
 */
function roundMinutes(minutes: number, method: string): number {
  switch (method) {
    case "5min":
      return Math.round(minutes / 5) * 5;
    case "10min":
      return Math.round(minutes / 10) * 10;
    case "15min":
      return Math.round(minutes / 15) * 15;
    default:
      return minutes;
  }
}

/**
 * Check if date is a public holiday (Turkey)
 * TODO: Implement actual holiday detection or use a holiday API
 */
function isPublicHoliday(date: Date): boolean {
  // Simplified - should use actual Turkey holiday calendar
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  // New Year
  if (month === 1 && day === 1) return true;
  // National Sovereignty and Children's Day
  if (month === 4 && day === 23) return true;
  // Labor Day
  if (month === 5 && day === 1) return true;
  // Victory Day
  if (month === 8 && day === 30) return true;
  // Republic Day
  if (month === 10 && day === 29) return true;
  
  return false;
}

/**
 * Check if date is weekend
 */
function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday or Saturday
}

/**
 * Check if time falls within night shift hours
 */
function isNightShiftTime(time: Date, shift: Shift): boolean {
  if (!shift.night_shift_start || !shift.night_shift_end) return false;
  
  const timeStr = time.toTimeString().slice(0, 5); // HH:mm
  return timeStr >= shift.night_shift_start || timeStr <= shift.night_shift_end;
}

/**
 * Pair in/out logs and calculate working time
 */
function pairInOutLogs(logs: PDKSLog[]): Array<{ in: PDKSLog; out: PDKSLog | null }> {
  const sorted = [...logs].sort((a, b) => 
    new Date(a.log_timestamp).getTime() - new Date(b.log_timestamp).getTime()
  );

  const pairs: Array<{ in: PDKSLog; out: PDKSLog | null }> = [];
  let currentIn: PDKSLog | null = null;

  for (const log of sorted) {
    if (log.direction === "in") {
      if (currentIn) {
        // Previous in without out - mark as missing out
        pairs.push({ in: currentIn, out: null });
      }
      currentIn = log;
    } else if (log.direction === "out") {
      if (currentIn) {
        pairs.push({ in: currentIn, out: log });
        currentIn = null;
      } else {
        // Out without in - mark as missing in
        pairs.push({ in: log, out: null });
      }
    }
  }

  // Handle last in without out
  if (currentIn) {
    pairs.push({ in: currentIn, out: null });
  }

  return pairs;
}

/**
 * Calculate timesheet from PDKS logs
 */
export function calculateTimesheetFromLogs(
  logs: PDKSLog[],
  workDate: Date,
  shift: Shift
): CalculatedTimesheet {
  const isHoliday = isPublicHoliday(workDate);
  const isWeekendDay = isWeekend(workDate);

  // If holiday or weekend, return early
  if (isHoliday || isWeekendDay) {
    return {
      first_in_time: null,
      last_out_time: null,
      gross_duration_minutes: 0,
      break_duration_minutes: 0,
      net_working_minutes: 0,
      overtime_minutes: 0,
      status: isHoliday ? "holiday" : "weekend",
      is_night_shift: false,
    };
  }

  if (logs.length === 0) {
    return {
      first_in_time: null,
      last_out_time: null,
      gross_duration_minutes: 0,
      break_duration_minutes: shift.break_duration_minutes,
      net_working_minutes: 0,
      overtime_minutes: 0,
      status: "missing",
      is_night_shift: false,
    };
  }

  // Pair in/out logs
  const pairs = pairInOutLogs(logs);
  
  if (pairs.length === 0) {
    return {
      first_in_time: null,
      last_out_time: null,
      gross_duration_minutes: 0,
      break_duration_minutes: shift.break_duration_minutes,
      net_working_minutes: 0,
      overtime_minutes: 0,
      status: "missing",
      is_night_shift: false,
    };
  }

  // Get first in and last out
  const firstIn = pairs[0]?.in;
  const lastPair = pairs[pairs.length - 1];
  const lastOut = lastPair?.out;

  const firstInTime = firstIn ? new Date(firstIn.log_timestamp) : null;
  const lastOutTime = lastOut ? new Date(lastOut.log_timestamp) : null;

  // Calculate gross duration
  let grossDurationMinutes = 0;
  for (const pair of pairs) {
    if (pair.out) {
      const inTime = new Date(pair.in.log_timestamp);
      const outTime = new Date(pair.out.log_timestamp);
      grossDurationMinutes += (outTime.getTime() - inTime.getTime()) / (1000 * 60);
    }
  }

  // Apply rounding
  grossDurationMinutes = roundMinutes(grossDurationMinutes, shift.rounding_method);

  // Deduct break time
  const breakDuration = shift.break_duration_minutes;
  const netWorkingMinutes = Math.max(0, grossDurationMinutes - breakDuration);

  // Check for night shift
  const isNightShift = firstInTime 
    ? isNightShiftTime(firstInTime, shift)
    : false;

  // Calculate overtime (daily threshold)
  const dailyThresholdMinutes = shift.daily_overtime_threshold_hours * 60;
  const overtimeMinutes = Math.max(0, netWorkingMinutes - dailyThresholdMinutes);

  // Determine status
  let status: CalculatedTimesheet["status"] = "normal";
  if (!firstInTime || !lastOutTime) {
    status = "missing";
  } else if (pairs.some(p => !p.out)) {
    status = "missing";
  }

  return {
    first_in_time: firstInTime,
    last_out_time: lastOutTime,
    gross_duration_minutes: Math.round(grossDurationMinutes),
    break_duration_minutes: breakDuration,
    net_working_minutes: Math.round(netWorkingMinutes),
    overtime_minutes: Math.round(overtimeMinutes),
    status,
    is_night_shift: isNightShift,
  };
}

/**
 * Fetch PDKS logs for an employee on a specific date
 */
export async function getPDKSLogsForDate(
  companyId: string,
  employeeId: string,
  date: Date
): Promise<PDKSLog[]> {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const { data, error } = await supabase
    .from("pdks_logs")
    .select("*")
    .eq("company_id", companyId)
    .eq("employee_id", employeeId)
    .gte("log_timestamp", startOfDay.toISOString())
    .lte("log_timestamp", endOfDay.toISOString())
    .order("log_timestamp", { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Get shift assignment for employee on a specific date
 */
export async function getShiftForEmployee(
  companyId: string,
  employeeId: string,
  date: Date
): Promise<Shift | null> {
  const dateStr = date.toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("shift_assignments")
    .select("shift_id, shifts(*)")
    .eq("company_id", companyId)
    .eq("employee_id", employeeId)
    .eq("is_active", true)
    .lte("effective_date", dateStr)
    .or(`end_date.is.null,end_date.gte.${dateStr}`)
    .order("effective_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data || !data.shifts) return null;

  return data.shifts as Shift;
}

