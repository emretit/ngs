import { Database } from '@/integrations/supabase/types';

export interface ServiceRequestAttachment {
  name: string;
  path: string;
  type: string;
  size: number;
}

export type ServiceStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'new' | 'assigned' | 'on_hold';
export type ServicePriority = 'low' | 'medium' | 'high' | 'urgent';

// Use database type with compatibility properties
export type ServiceRequest = Database['public']['Tables']['service_requests']['Row'] & {
  // Compatibility properties for existing components
  title: string;
  description: string | null;
  status: string;
  priority: string;
  assigned_to?: string;
  due_date?: string;
  service_number?: string;
  service_type?: string;
  issue_date?: string;
  estimated_duration?: number; // dakika cinsinden tahmini süre
};

export type ServiceRequestFormData = Database['public']['Tables']['service_requests']['Insert'] & {
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  assigned_to?: string;
  due_date?: string;
  service_due_date?: Date | string;
  service_reported_date?: Date | string;
  issue_date?: Date | string;
  assigned_technician?: string;
};

export interface UseServiceRequestsResult {
  serviceRequests: ServiceRequest[];
  data: ServiceRequest[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
  createServiceRequest: (params: { formData: ServiceRequestFormData, files: File[] }) => void;
  updateServiceRequest: (params: { id: string; updateData: Partial<ServiceRequestFormData>; newFiles?: File[] }) => void;
  deleteServiceRequest: (id: string) => void;
  getServiceRequest: (id: string) => ServiceRequest | undefined;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  isDeletingAttachment: boolean;
  deleteAttachment: (params: { requestId: string, attachmentPath: string }) => void;
}

export interface ServiceQueriesResult {
  serviceRequests: ServiceRequest[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  getServiceRequest: (id: string) => Promise<ServiceRequest | null>;
}

export interface ServiceMutationsResult {
  createServiceRequest: (params: { formData: ServiceRequestFormData, files: File[] }) => void;
  updateServiceRequest: (params: { id: string; updateData: Partial<ServiceRequestFormData>; newFiles?: File[] }) => void;
  deleteServiceRequest: (id: string) => void;
  deleteAttachment: (params: { requestId: string, attachmentPath: string }) => void;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  isDeletingAttachment: boolean;
}