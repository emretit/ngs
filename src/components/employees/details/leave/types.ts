
export interface LeaveRecord {
  id: string;
  employee_id: string;
  leave_type: 'annual' | 'sick' | 'parental' | 'unpaid' | 'other';
  start_date: string;
  end_date: string;
  total_days: number;
  status: 'approved' | 'pending' | 'rejected';
  reason: string;
  notes: string | null;
  approved_by: string | null;
  created_at: string;
}

export interface LeaveBalance {
  annual: number;
  sick: number;
  parental: number;
  unpaid: number;
  other: number;
}
