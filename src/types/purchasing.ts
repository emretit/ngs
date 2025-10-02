// SPRINT 1: Purchase Requests & Approvals Types

export type PurchaseRequestStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'converted';
export type PurchaseRequestPriority = 'low' | 'normal' | 'high' | 'urgent';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'skipped';

export interface PurchaseRequest {
  id: string;
  company_id: string;
  request_number: string;
  requester_id: string;
  department_id?: string;
  status: PurchaseRequestStatus;
  priority: PurchaseRequestPriority;
  need_by_date?: string;
  requester_notes?: string;
  cost_center?: string;
  created_at: string;
  updated_at: string;
  
  // Relations
  requester?: {
    first_name: string;
    last_name: string;
  };
  department?: {
    name: string;
  };
  items?: PurchaseRequestItem[];
  approvals?: Approval[];
}

export interface PurchaseRequestItem {
  id: string;
  request_id: string;
  product_id?: string;
  description: string;
  quantity: number;
  estimated_price?: number;
  uom?: string;
  notes?: string;
  
  // Relations
  product?: {
    name: string;
    code: string;
  };
}

export interface Approval {
  id: string;
  company_id: string;
  object_type: string; // 'purchase_request', 'purchase_order', etc.
  object_id: string;
  step: number;
  approver_id?: string;
  status: ApprovalStatus;
  decided_at?: string;
  comment?: string;
  created_at: string;
  updated_at: string;
  
  // Relations
  approver?: {
    first_name: string;
    last_name: string;
  };
}

export interface PurchaseRequestFormData {
  requester_id: string;
  department_id?: string;
  priority: PurchaseRequestPriority;
  need_by_date?: string;
  requester_notes?: string;
  cost_center?: string;
  items: {
    product_id?: string;
    description: string;
    quantity: number;
    estimated_price?: number;
    uom?: string;
    notes?: string;
  }[];
}

export interface PurchasingSettings {
  id: string;
  company_id: string;
  pr_prefix: string;
  po_prefix: string;
  rfq_prefix: string;
  grn_prefix: string;
  approval_threshold_level1: number;
  approval_threshold_level2: number;
  default_tax_rate: number;
  default_currency: string;
}
