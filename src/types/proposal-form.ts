
import { ProposalItem, ProposalStatus } from "./proposal";

export interface ProposalFormData {
  title: string;
  subject?: string; // Teklif konusu
  customer_id?: string;
  employee_id?: string; // Müşteri temsilcisi
  prepared_by?: string; // Hazırlayan
  opportunity_id?: string;
  items?: ProposalItem[];
  valid_until?: string;
  payment_terms?: string;
  delivery_terms?: string;
  warranty_terms?: string;
  price_terms?: string;
  other_terms?: string;
  notes?: string;
  internalNotes?: string;
  terms?: string;
  paymentTerm?: string;
  discounts?: number;
  additionalCharges?: number;
  total_amount?: number;
  description?: string;
  status: ProposalStatus; // Changed from optional to required
  currency?: string; // Proposal currency
  exchange_rate?: number; // Döviz kuru
  computed_total_amount?: number; // Computed total for display purposes
}

// Export the ProposalItem type (using export type for isolatedModules)
export type { ProposalItem } from "./proposal";

// Adding the PaymentTerm type that's missing
export type PaymentTerm = "prepaid" | "net15" | "net30" | "net60" | "custom";
