
// CRM Types: Opportunities
export type OpportunityStatus = 
  | 'new'               // Yeni
  | 'meeting_visit'     // Görüşme ve Ziyaret
  | 'proposal'          // Teklif
  | 'won'               // Kazanıldı
  | 'lost';             // Kaybedildi

export type OpportunityPriority = 'low' | 'medium' | 'high';

// Map opportunity status to user-friendly labels
export const opportunityStatusLabels: Record<OpportunityStatus, string> = {
  new: "Yeni",
  meeting_visit: "Görüşme ve Ziyaret",
  proposal: "Teklif",
  won: "Kazanıldı",
  lost: "Kaybedildi"
};

// Map opportunity priority to user-friendly labels
export const opportunityPriorityLabels: Record<OpportunityPriority, string> = {
  low: "Düşük",
  medium: "Orta",
  high: "Yüksek"
};

// Map opportunity status to colors for UI
export const opportunityStatusColors: Record<OpportunityStatus, string> = {
  new: "bg-blue-100 text-blue-800",
  meeting_visit: "bg-purple-100 text-purple-800",
  proposal: "bg-orange-100 text-orange-800",
  won: "bg-green-100 text-green-800",
  lost: "bg-red-100 text-red-800"
};

// Contact history entries for opportunities
export interface ContactHistoryItem {
  id: string;
  date: string;
  contact_type: "call" | "email" | "meeting" | "other";
  notes: string;
  employee_id?: string;
  employee_name?: string;
}

// Customer object structure from database
export interface Customer {
  id: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
}

// Employee object structure from database
export interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  avatar_url?: string;
}

// Opportunity object structure
export interface Opportunity {
  id: string;
  title: string;
  description?: string;
  status: OpportunityStatus;
  priority: OpportunityPriority;
  value: number;
  currency?: string;
  customer_id?: string;
  employee_id?: string;
  created_at: string;
  updated_at: string;
  expected_close_date?: string;
  notes?: string;
  contact_history?: ContactHistoryItem[];
  
  // Joined relations
  customer?: Customer;
  employee?: Employee;
}

// Opportunities state type for Kanban view
export interface OpportunitiesState {
  new: Opportunity[];
  meeting_visit: Opportunity[];
  proposal: Opportunity[];
  won: Opportunity[];
  lost: Opportunity[];
}
