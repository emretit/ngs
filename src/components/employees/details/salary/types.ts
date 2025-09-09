
export interface SalaryRecord {
  id: string;
  employee_id: string;
  base_salary: number;
  allowances: number;
  bonuses: number;
  deductions: number;
  effective_date: string;
  payment_date: string;
  status: 'paid' | 'pending' | 'processing';
  notes: string | null;
  created_at: string;
}
