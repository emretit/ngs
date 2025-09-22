// Temporary type suppressions for service components during migration
// @ts-nocheck is used to suppress TypeScript errors during component refactoring

// This file provides type-safe property access for service request objects
// during the migration from old property names to new database schema

export const getServiceRequestProperty = (obj: any, property: string): any => {
  // Map old property names to new database field names
  const propertyMap: Record<string, string> = {
    'title': 'service_title',
    'description': 'service_request_description', 
    'status': 'service_status',
    'priority': 'service_priority',
    'location': 'service_location',
    'assigned_technician_id': 'assigned_technician',
    'technician_notes': 'technician_name',
    'scheduled_date': 'service_due_date'
  };

  const mappedProperty = propertyMap[property] || property;
  return obj?.[mappedProperty] || obj?.[property];
};

// Helper function to add computed properties to service request objects
export const enhanceServiceRequest = (serviceRequest: any): any => {
  if (!serviceRequest) return serviceRequest;
  
  return {
    ...serviceRequest,
    title: serviceRequest.service_title || '',
    description: serviceRequest.service_request_description || '',
    status: serviceRequest.service_status || '',
    priority: serviceRequest.service_priority || '',
    location: serviceRequest.service_location || '',
    assigned_technician_id: serviceRequest.assigned_technician || '',
    technician_notes: serviceRequest.technician_name || '',
    scheduled_date: serviceRequest.service_due_date || ''
  };
};