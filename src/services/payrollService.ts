/**
 * Payroll Calculation Service
 * Enterprise-grade payroll calculation compliant with Turkey payroll, SGK and tax rules
 * Calculation order: import approved timesheets → calculate gross → apply SGK limits → 
 * calculate income tax base → apply progressive brackets → apply deductions → calculate net → calculate employer cost
 */

import { supabase } from "@/integrations/supabase/client";

export interface PayrollYearParameters {
  id: string;
  year: number;
  income_tax_brackets: Array<{ min: number; max: number; rate: number }>;
  sgk_min_base: number;
  sgk_max_base: number;
  sgk_employee_rate: number;
  sgk_employer_rate: number;
  unemployment_employee_rate: number;
  unemployment_employer_rate: number;
  accident_insurance_rate: number;
  stamp_tax_rate: number;
}

export interface TimesheetDay {
  id: string;
  employee_id: string;
  work_date: string;
  net_working_minutes: number;
  overtime_minutes: number;
  status: string;
  approval_status: string;
}

export interface EmployeeSalary {
  employee_id: string;
  base_salary: number;
  gross_salary?: number;
}

export interface PayrollCalculationResult {
  employee_id: string;
  base_salary: number;
  overtime_pay: number;
  bonus_premium: number;
  allowances_cash: number;
  allowances_in_kind: number;
  gross_salary: number;
  sgk_base: number;
  income_tax_base: number;
  sgk_employee_share: number;
  unemployment_employee: number;
  income_tax_amount: number;
  stamp_tax_amount: number;
  advances: number;
  garnishments: number;
  total_deductions: number;
  net_salary: number;
  sgk_employer_share: number;
  unemployment_employer: number;
  accident_insurance: number;
  total_employer_cost: number;
  warnings: string[];
}

/**
 * Get yearly payroll parameters for a given year
 */
export async function getPayrollYearParameters(
  companyId: string,
  year: number
): Promise<PayrollYearParameters | null> {
  const { data, error } = await supabase
    .from("payroll_year_parameters")
    .select("*")
    .eq("company_id", companyId)
    .eq("year", year)
    .eq("is_active", true)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Calculate income tax using progressive brackets
 */
export function calculateIncomeTax(
  taxBase: number,
  brackets: Array<{ min: number; max: number; rate: number }>
): number {
  let tax = 0;
  let remaining = taxBase;

  for (const bracket of brackets.sort((a, b) => a.min - b.min)) {
    if (remaining <= 0) break;

    const bracketAmount = Math.min(
      remaining,
      bracket.max === -1 ? remaining : bracket.max - bracket.min
    );

    if (bracketAmount > 0) {
      tax += bracketAmount * bracket.rate;
      remaining -= bracketAmount;
    }
  }

  return Math.round(tax * 100) / 100; // Round to 2 decimals
}

/**
 * Calculate payroll for a single employee
 */
export function calculateEmployeePayroll(
  employeeId: string,
  baseSalary: number,
  approvedTimesheets: TimesheetDay[],
  yearParams: PayrollYearParameters,
  overtimeRate: number = 1.5,
  monthlyHours: number = 180
): PayrollCalculationResult {
  const warnings: string[] = [];

  // Calculate overtime pay
  const totalOvertimeMinutes = approvedTimesheets.reduce(
    (sum, ts) => sum + (ts.overtime_minutes || 0),
    0
  );
  const overtimeHours = totalOvertimeMinutes / 60;
  const hourlyRate = baseSalary / monthlyHours;
  const overtimePay = Math.round((overtimeHours * hourlyRate * overtimeRate) * 100) / 100;

  // Calculate gross salary
  const bonusPremium = 0; // TODO: Get from employee bonuses
  const allowancesCash = 0; // TODO: Get from employee allowances
  const allowancesInKind = 0; // TODO: Get from employee allowances
  const grossSalary = baseSalary + overtimePay + bonusPremium + allowancesCash + allowancesInKind;

  // Apply SGK base limits
  let sgkBase = grossSalary;
  if (sgkBase < yearParams.sgk_min_base) {
    sgkBase = yearParams.sgk_min_base;
    warnings.push(`SGK base adjusted to minimum: ${yearParams.sgk_min_base}`);
  } else if (sgkBase > yearParams.sgk_max_base) {
    sgkBase = yearParams.sgk_max_base;
    warnings.push(`SGK base capped at maximum: ${yearParams.sgk_max_base}`);
  }

  // Calculate income tax base (gross - SGK employee share - unemployment employee)
  const sgkEmployeeShare = Math.round(sgkBase * yearParams.sgk_employee_rate * 100) / 100;
  const unemploymentEmployee = Math.round(sgkBase * yearParams.unemployment_employee_rate * 100) / 100;
  const incomeTaxBase = grossSalary - sgkEmployeeShare - unemploymentEmployee;

  // Calculate income tax using progressive brackets
  const incomeTaxAmount = calculateIncomeTax(incomeTaxBase, yearParams.income_tax_brackets);

  // Calculate stamp tax (on gross salary)
  const stampTaxAmount = Math.round(grossSalary * yearParams.stamp_tax_rate * 100) / 100;

  // Other deductions
  const advances = 0; // TODO: Get from employee advances
  const garnishments = 0; // TODO: Get from employee garnishments

  // Total deductions
  const totalDeductions =
    sgkEmployeeShare +
    unemploymentEmployee +
    incomeTaxAmount +
    stampTaxAmount +
    advances +
    garnishments;

  // Net salary
  const netSalary = Math.round((grossSalary - totalDeductions) * 100) / 100;

  // Employer costs
  const sgkEmployerShare = Math.round(sgkBase * yearParams.sgk_employer_rate * 100) / 100;
  const unemploymentEmployer = Math.round(sgkBase * yearParams.unemployment_employer_rate * 100) / 100;
  const accidentInsurance = Math.round(sgkBase * yearParams.accident_insurance_rate * 100) / 100;
  const totalEmployerCost =
    grossSalary + sgkEmployerShare + unemploymentEmployer + accidentInsurance;

  // Validations
  if (incomeTaxBase < 0) {
    warnings.push("Income tax base is negative - check calculations");
  }

  if (netSalary < 0) {
    warnings.push("Net salary is negative - deductions exceed gross salary");
  }

  return {
    employee_id: employeeId,
    base_salary: baseSalary,
    overtime_pay: overtimePay,
    bonus_premium: bonusPremium,
    allowances_cash: allowancesCash,
    allowances_in_kind: allowancesInKind,
    gross_salary: grossSalary,
    sgk_base: sgkBase,
    income_tax_base: incomeTaxBase,
    sgk_employee_share: sgkEmployeeShare,
    unemployment_employee: unemploymentEmployee,
    income_tax_amount: incomeTaxAmount,
    stamp_tax_amount: stampTaxAmount,
    advances: advances,
    garnishments: garnishments,
    total_deductions: totalDeductions,
    net_salary: netSalary,
    sgk_employer_share: sgkEmployerShare,
    unemployment_employer: unemploymentEmployer,
    accident_insurance: accidentInsurance,
    total_employer_cost: totalEmployerCost,
    warnings,
  };
}

/**
 * Calculate payroll for all employees in a period
 */
export async function calculatePayrollRun(
  companyId: string,
  year: number,
  month: number
): Promise<PayrollCalculationResult[]> {
  // Get year parameters
  const yearParams = await getPayrollYearParameters(companyId, year);
  if (!yearParams) {
    throw new Error(`Payroll parameters not found for year ${year}`);
  }

  // Get approved timesheets for the period (only manager_approved or hr_locked, not draft)
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate = `${year}-${String(month).padStart(2, "0")}-${new Date(year, month, 0).getDate()}`;

  const { data: timesheets, error: tsError } = await supabase
    .from("timesheet_days")
    .select("*")
    .eq("company_id", companyId)
    .in("approval_status", ["manager_approved", "hr_locked"])
    .gte("work_date", startDate)
    .lte("work_date", endDate);

  if (tsError) throw tsError;

  // Get employees with their base salaries
  const { data: employees, error: empError } = await supabase
    .from("employees")
    .select("id, gross_salary, salary_amount")
    .eq("company_id", companyId)
    .eq("status", "aktif");

  if (empError) throw empError;

  // Group timesheets by employee
  const timesheetsByEmployee = new Map<string, TimesheetDay[]>();
  (timesheets || []).forEach((ts) => {
    const existing = timesheetsByEmployee.get(ts.employee_id) || [];
    existing.push(ts);
    timesheetsByEmployee.set(ts.employee_id, existing);
  });

  // Calculate payroll for each employee
  const results: PayrollCalculationResult[] = [];

  for (const employee of employees || []) {
    const employeeTimesheets = timesheetsByEmployee.get(employee.id) || [];
    const baseSalary = employee.gross_salary || employee.salary_amount || 0;

    if (baseSalary <= 0) {
      continue; // Skip employees without salary
    }

    const calculation = calculateEmployeePayroll(
      employee.id,
      baseSalary,
      employeeTimesheets,
      yearParams
    );

    results.push(calculation);
  }

  return results;
}

