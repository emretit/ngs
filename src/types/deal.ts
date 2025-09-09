
import { OpportunityStatus, OpportunityPriority } from "./crm";

// Map deal status to opportunity status for compatibility
export type DealStatus = OpportunityStatus | "negotiation" | "follow_up" | "won";

export interface Deal {
  id: string;
  title: string;
  value: number;
  customerName?: string;
  employeeName?: string;
  priority: OpportunityPriority;
  status: DealStatus;
  proposalDate?: Date;
  lastContactDate?: Date;
  expectedCloseDate?: Date;
  description?: string;
  department?: string;
  contactHistory?: any[];
  proposalFiles?: any[];
  nextSteps?: any[];
  productServices?: any[];
  reminders?: any[];
  notes?: string;
  internalComments?: string;
}

// Add mapping to make DealStatus compatible with OpportunityStatus
export const dealToOpportunityStatus = (dealStatus: DealStatus): OpportunityStatus => {
  switch (dealStatus) {
    case "negotiation": return "proposal";
    case "follow_up": return "meeting_visit";
    case "won": return "won";
    default: return dealStatus as OpportunityStatus;
  }
};
