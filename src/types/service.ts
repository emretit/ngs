
export type ServiceRequestStatus = 'new' | 'assigned' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold';
export type ServiceRequestPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface ServiceRequestAttachment {
  name: string;
  path: string;
  type: string;
  size: number;
}

export interface ServiceRequest {
  id: string;
  title: string;
  description?: string;
  status: ServiceRequestStatus;
  priority: ServiceRequestPriority;
  customer_id?: string;
  service_type?: string;
  location?: string;
  due_date?: string;
  assignee_id?: string;
  assigned_to?: string;
  equipment_id?: string;
  notes?: string[];
  warranty_info?: Record<string, any>;
  attachments: ServiceRequestAttachment[];
  created_at?: string;
  updated_at?: string;
}
