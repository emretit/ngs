
import { Database } from '@/integrations/supabase/types';

export type ServiceRequestStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type ServiceRequestPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface ServiceRequestAttachment {
  name: string;
  path: string;
  type: string;
  size: number;
}

// Comprehensive ServiceRequest type with mapped properties from database
export type ServiceRequest = Database['public']['Tables']['service_requests']['Row'] & {
  // Map database fields to commonly used property names
  title: string;
  description: string | null;
  status: string;
  priority: string;
  location: string | null;
  assigned_technician_id: string | null;
  technician_notes: string | null;
  scheduled_date: string | null;
};

// Form data type with mapped properties
export type ServiceRequestFormData = Database['public']['Tables']['service_requests']['Insert'] & {
  // Map form fields
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  location?: string;
  assigned_technician_id?: string;
  scheduled_date?: string;
  service_reported_date?: Date | string;
  service_due_date?: Date | string;
  issue_date?: Date | string;
};

// Helper function to transform database record to component-friendly format
export const transformServiceRequest = (dbRecord: Database['public']['Tables']['service_requests']['Row']): ServiceRequest => {
  return {
    ...dbRecord,
    title: dbRecord.service_title || '',
    description: dbRecord.service_request_description,
    status: dbRecord.service_status || '',
    priority: dbRecord.service_priority || '',
    location: dbRecord.service_location,
    assigned_technician_id: dbRecord.assigned_technician,
    technician_notes: dbRecord.technician_name,
    scheduled_date: dbRecord.service_due_date,
  };
};
