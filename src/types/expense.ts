export type ExpenseCategory = 'travel' | 'meals' | 'supplies' | 'other';
export type ExpenseStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'paid';

export interface ExpenseRequest {
  id: string;
  company_id: string;
  request_number: string;
  requester_id: string;
  employee_id: string | null;
  department_id: string | null;

  expense_date: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  currency: string;

  status: ExpenseStatus;
  receipt_url?: string | null;
  notes?: string | null;

  approved_at?: string | null;
  paid_at?: string | null;

  created_at: string;
  updated_at: string;
}

