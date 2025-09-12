
import { QueryClient } from "@tanstack/react-query";
import { Database } from '@/integrations/supabase/types';

export interface ServiceRequestAttachment {
  name: string;
  path: string;
  type: string;
  size: number;
}

export type ServicePriority = 'low' | 'medium' | 'high' | 'urgent';
export type ServiceStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'new' | 'assigned' | 'on_hold';

// Use the database type as the main ServiceRequest type with compatibility fields
export type ServiceRequest = Database['public']['Tables']['service_requests']['Row'] & {
  // Compatibility fields for existing components
  assigned_to?: string;
  due_date?: string;
  reported_date?: string;
  service_title?: string;
  service_number?: string;
  service_priority?: ServicePriority;
  service_status?: ServiceStatus;
  service_location?: string;
  service_reported_date?: string;
  service_due_date?: string;
  issue_date?: string;
  equipment_id?: string;
  notes?: string[];
  service_request_description?: string;
  assigned_technician?: string;
  slip_status?: 'draft' | 'completed' | 'signed';
};

// Service slip data type
export type ServiceSlipData = Database['public']['Tables']['service_slips']['Row'] & {
  slip_status?: 'draft' | 'in_progress' | 'completed';
};


// Form data type for creating/updating service requests
export type ServiceRequestFormData = Database['public']['Tables']['service_requests']['Insert'] & {
  // Compatibility fields for forms
  service_title?: string;
  service_priority?: ServicePriority;
  service_location?: string;
  service_reported_date?: Date;
  service_due_date?: Date;
  issue_date?: Date;
  due_date?: Date;
  assigned_to?: string;
  assigned_technician?: string;
  service_request_description?: string;
  service_result?: string;
};

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
