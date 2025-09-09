
// This file re-exports from the new refactored location to maintain backward compatibility
export { useServiceRequests } from "./service/useServiceRequests";
export type {
  ServiceRequest,
  ServiceRequestFormData,
  ServicePriority,
  ServiceStatus,
  ServiceRequestAttachment
} from "./service/types";
