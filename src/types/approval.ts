export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'skipped';
export type ApprovalObjectType = 'leave_request' | 'expense_request' | 'purchase_request' | 'budget_revision';
export type ApproverRole = 'direct_manager' | 'senior_manager' | 'department_head' | 'final_approver';

export interface Approval {
  id: string;
  company_id: string;
  object_type: ApprovalObjectType;
  object_id: string;
  step: number;
  approver_id: string | null;
  approver_role?: ApproverRole | null;
  hierarchy_level?: number | null;
  status: ApprovalStatus;
  decided_at?: string | null;
  comment?: string | null;
  auto_approved?: boolean;
  skipped_reason?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ManagerChainItem {
  level: number;
  employee_id: string;
  employee_name: string;
  employee_email: string;
  employee_position: string;
  department: string;
  is_department_head: boolean;
}

export interface ApprovalWorkflow {
  id: string;
  company_id: string;
  object_type: ApprovalObjectType;
  workflow_type: 'hierarchical' | 'fixed' | 'threshold' | 'hybrid';
  max_hierarchy_levels: number;
  require_department_head: boolean;
  threshold_rules: ThresholdRule[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ThresholdRule {
  max_amount: number;
  levels: number;
}

