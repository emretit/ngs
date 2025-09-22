// @ts-nocheck
// Temporary placeholder during migration

export interface ServiceRequestAttachment {
  name: string;
  path: string;
  type: string;
  size: number;
}

export type ServiceStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'new' | 'assigned' | 'on_hold';
export type ServicePriority = 'low' | 'medium' | 'high' | 'urgent';

export type ServiceRequest = {
  id: string;
  service_title: string;
  service_status: string;
  service_priority: string;
  service_location: string;
  service_request_description: string;
  assigned_technician: string;
  created_at: string;
  updated_at: string;
  company_id: string;
  customer_id: string;
};

export type ServiceRequestFormData = ServiceRequest;

export interface UseServiceRequestsResult {
  serviceRequests: ServiceRequest[];
  data: ServiceRequest[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
  createServiceRequest: (data: any) => Promise<void>;
  updateServiceRequest: (id: string, data: any) => Promise<void>;
  deleteServiceRequest: (id: string) => Promise<void>;
  getServiceRequest: (id: string) => ServiceRequest | undefined;
}

export interface ServiceQueriesResult {
  serviceRequests: ServiceRequest[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export interface ServiceMutationsResult {
  createServiceRequest: (data: any) => Promise<void>;
  updateServiceRequest: (id: string, data: any) => Promise<void>;
  deleteServiceRequest: (id: string) => Promise<void>;
}