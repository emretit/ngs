
import { QueryClient } from "@tanstack/react-query";

export interface ServiceRequestAttachment {
  name: string;
  path: string;
  type: string;
  size: number;
}

export type ServicePriority = 'low' | 'medium' | 'high' | 'urgent';
export type ServiceStatus = 'new' | 'in_progress' | 'completed' | 'cancelled' | 'assigned' | 'on_hold';

export interface ServiceRequest {
  id: string;
  title: string;
  description?: string;
  status: ServiceStatus;
  priority: ServicePriority;
  service_type: string;
  attachments: ServiceRequestAttachment[];
  notes?: string[];
  created_at?: string;
  updated_at?: string;
  assigned_to?: string;
  customer_id?: string;
  equipment_id?: string;
  warranty_info?: Record<string, any>;
  location?: string;
  due_date?: string;
}

export interface ServiceRequestFormData {
  id?: string;
  title: string;
  description?: string;
  priority: ServicePriority;
  customer_id?: string;
  service_type: string;
  location?: string;
  due_date?: Date;
  equipment_id?: string;
}

export interface ServiceQueriesResult {
  data: ServiceRequest[] | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<any>;
  getServiceRequest: (id: string) => Promise<ServiceRequest | null>;
}

export interface ServiceMutationsResult {
  createServiceRequest: (params: { formData: ServiceRequestFormData, files: File[] }) => void;
  isCreating: boolean;
  updateServiceRequest: (params: { id: string; updateData: Partial<ServiceRequestFormData>; newFiles?: File[] }) => void;
  isUpdating: boolean;
  deleteServiceRequest: (id: string) => void;
  isDeleting: boolean;
  deleteAttachment: (params: { requestId: string, attachmentPath: string }) => void;
  isDeletingAttachment: boolean;
}

export interface UseServiceRequestsResult extends ServiceQueriesResult, ServiceMutationsResult {}
