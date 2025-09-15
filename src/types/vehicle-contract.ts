export interface VehicleContract {
  id: string;
  vehicle_id: string;
  contract_type: 'kiralama' | 'sigorta' | 'bakım' | 'garanti' | 'hizmet';
  contract_number: string;
  contract_name: string;
  provider_name: string;
  provider_contact?: string;
  provider_phone?: string;
  provider_email?: string;
  start_date: string;
  end_date: string;
  monthly_cost: number;
  total_cost: number;
  currency: string;
  auto_renewal: boolean;
  renewal_notice_days: number;
  status: 'aktif' | 'süresi_doldu' | 'iptal' | 'askıda';
  payment_frequency: 'günlük' | 'haftalık' | 'aylık' | 'yıllık' | 'tek_seferlik';
  payment_method?: 'nakit' | 'kredi_kartı' | 'havale' | 'çek' | 'otomatik_ödeme';
  contract_terms?: string;
  special_conditions?: string;
  attachments: any[];
  notes?: string;
  created_at: string;
  updated_at: string;
  company_id?: string;
}

export interface VehicleContractFormData {
  vehicle_id: string;
  contract_type: 'kiralama' | 'sigorta' | 'bakım' | 'garanti' | 'hizmet';
  contract_number: string;
  contract_name: string;
  provider_name: string;
  provider_contact?: string;
  provider_phone?: string;
  provider_email?: string;
  start_date: string;
  end_date: string;
  monthly_cost: number;
  total_cost: number;
  currency: string;
  auto_renewal: boolean;
  renewal_notice_days: number;
  status: 'aktif' | 'süresi_doldu' | 'iptal' | 'askıda';
  payment_frequency: 'günlük' | 'haftalık' | 'aylık' | 'yıllık' | 'tek_seferlik';
  payment_method?: 'nakit' | 'kredi_kartı' | 'havale' | 'çek' | 'otomatik_ödeme';
  contract_terms?: string;
  special_conditions?: string;
  attachments?: any[];
  notes?: string;
}

export type ContractType = 'kiralama' | 'sigorta' | 'bakım' | 'garanti' | 'hizmet';
export type ContractStatus = 'aktif' | 'süresi_doldu' | 'iptal' | 'askıda';
export type PaymentFrequency = 'günlük' | 'haftalık' | 'aylık' | 'yıllık' | 'tek_seferlik';
export type PaymentMethod = 'nakit' | 'kredi_kartı' | 'havale' | 'çek' | 'otomatik_ödeme';

// Contract statistics
export interface ContractStats {
  total_contracts: number;
  active_contracts: number;
  expiring_soon: number;
  total_monthly_cost: number;
  contracts_by_type: Record<ContractType, number>;
  contracts_by_status: Record<ContractStatus, number>;
}

// Contract alerts
export interface ContractAlert {
  id: string;
  contract_id: string;
  vehicle_id: string;
  contract_name: string;
  vehicle_plate: string;
  alert_type: 'expiring' | 'expired' | 'renewal_due';
  days_remaining: number;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}
