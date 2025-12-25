export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export type LeaveType = 
  | 'annual' 
  | 'sick' 
  | 'unpaid' 
  | 'maternity' 
  | 'paternity' 
  | 'compassionate' 
  | 'other';

export interface LeaveRequest {
  id: string;
  tenant_id?: string;
  employee_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  days: number;
  status: LeaveStatus;
  approver_id?: string | null;
  reason?: string | null;
  created_at: string;
  updated_at?: string;
  // Joined data
  employee?: {
    id: string;
    full_name?: string;
    first_name?: string;
    last_name?: string;
    department?: string | null;
  } | null;
  approver?: {
    id: string;
    full_name?: string;
    first_name?: string;
    last_name?: string;
  } | null;
}

export interface LeaveSummaryStats {
  todayOnLeave: number;
  pendingApprovals: number;
  upcoming7Days: number;
  thisMonthTotal: number;
}

