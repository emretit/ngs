
import { Database } from '@/integrations/supabase/types';

export type ServiceRequestStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type ServiceRequestPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface ServiceRequestAttachment {
  name: string;
  path: string;
  type: string;
  size: number;
}

// Use the database type as the main ServiceRequest type
export type ServiceRequest = Database['public']['Tables']['service_requests']['Row'];

// Form data type for creating/updating service requests
export type ServiceRequestFormData = Database['public']['Tables']['service_requests']['Insert'];
