
import { FileText, Clock, Send, CheckCircle, XCircle, AlertTriangle, type LucideIcon } from "lucide-react";

export type ProposalStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'pending_approval';

// Status label mapping for UI display
export const proposalStatusLabels: Record<ProposalStatus, string> = {
  draft: 'Taslak',
  pending_approval: 'Onay Bekliyor',
  sent: 'Gönderildi',
  accepted: 'Kabul Edildi',
  rejected: 'Reddedildi',
  expired: 'Süresi Dolmuş'
};

// Status icon mapping for UI display  
export const proposalStatusIcons: Record<ProposalStatus, LucideIcon> = {
  draft: FileText,
  pending_approval: Clock,
  sent: Send,
  accepted: CheckCircle,
  rejected: XCircle,
  expired: AlertTriangle
};

// Simplified status color mapping - using semantic colors
export const proposalStatusColors: Record<ProposalStatus, string> = {
  draft: 'bg-muted text-muted-foreground',
  pending_approval: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
  sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  accepted: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
  expired: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
};

export interface ProposalItem {
  id: string;
  product_id?: string;
  name: string;
  description?: string;
  quantity: number;
  unit: string; // Unit of measurement (adet, saat, gün, etc.)
  unit_price: number;
  tax_rate?: number;
  discount_rate?: number;
  total_price: number;
  currency?: string;
  group?: string; // Group information (e.g., product, service)
  stock_status?: 'in_stock' | 'low_stock' | 'out_of_stock';
  original_currency?: string; // Original currency of the product
  original_price?: number; // Original price of the product
}

export interface ProposalAttachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  created_at: string;
}

// Customer and Employee interfaces to support relations
export interface Customer {
  id: string;
  name: string;
  email?: string;
  company?: string;
  phone?: string;
  mobile_phone?: string;
  office_phone?: string;
  address?: string;
  tax_number?: string;
  tax_office?: string;
}

export interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  position?: string;
  department?: string;
  avatar_url?: string;
}

export interface Proposal extends Record<string, unknown> {
  id: string;
  number: string;
  title: string;
  subject?: string; // Teklif konusu
  description?: string;
  customer_id?: string;
  customer_name?: string;
  customer_email?: string;
  employee_id?: string;
  employee_name?: string;
  opportunity_id?: string;
  opportunity_title?: string;
  valid_until?: string;
  payment_terms?: string;
  payment_method?: string;
  delivery_terms?: string;
  delivery_method?: string;
  warranty_terms?: string;
  price_terms?: string;
  other_terms?: string;
  notes?: string;
  terms?: string;
  status: ProposalStatus;
  created_at: string;
  updated_at: string;
  total_amount: number;
  currency?: string; // Currency
  exchange_rate?: number; // Döviz kuru
  items?: ProposalItem[];
  attachments?: ProposalAttachment[];
  
  // Additional fields used in various components
  proposal_number?: string; // Backward compatibility field
  total_value?: number; // Backward compatibility field for total_amount
  internal_notes?: string;
  discounts?: number;
  additional_charges?: number;
  
  // Relations
  customer?: Customer;
  employee?: Employee;
}

export interface ProposalFormValues {
  title: string;
  description?: string;
  customerId?: string;
  employeeId?: string;
  opportunityId?: string;
  validUntil?: Date;
  paymentTerms?: string;
  deliveryTerms?: string;
  notes?: string;
  status: ProposalStatus;
  items?: ProposalItem[];
  currency?: string; // Currency
}
