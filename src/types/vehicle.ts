export interface Vehicle {
  id: string;
  plate_number: string;
  brand: string;
  model: string;
  year?: number;
  color?: string;
  fuel_type: 'benzin' | 'dizel' | 'lpg' | 'elektrik' | 'hibrit';
  engine_size?: string;
  transmission: 'manuel' | 'otomatik' | 'yarı_otomatik';
  vin_number?: string;
  status: 'aktif' | 'pasif' | 'bakım' | 'satıldı' | 'hasar';
  purchase_date?: string;
  purchase_price?: number;
  current_value?: number;
  mileage?: number;
  insurance_company?: string;
  insurance_policy_number?: string;
  insurance_start_date?: string;
  insurance_end_date?: string;
  inspection_date?: string;
  next_inspection_date?: string;
  assigned_driver_id?: string;
  assigned_department?: string;
  location_address?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  company_id?: string;
}

export interface VehicleMaintenance {
  id: string;
  vehicle_id: string;
  maintenance_type: string;
  description?: string;
  maintenance_date: string;
  mileage_at_maintenance?: number;
  cost?: number;
  service_provider?: string;
  next_maintenance_date?: string;
  next_maintenance_mileage?: number;
  status: 'planlandı' | 'devam_ediyor' | 'tamamlandı' | 'iptal';
  technician_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  company_id?: string;
}

export interface VehicleFuel {
  id: string;
  vehicle_id: string;
  fuel_date: string;
  liters: number;
  cost_per_liter: number;
  total_cost: number;
  mileage?: number;
  fuel_station?: string;
  receipt_url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  company_id?: string;
}

export interface VehicleDocument {
  id: string;
  vehicle_id: string;
  document_type: 'ruhsat' | 'sigorta' | 'muayene' | 'egzoz' | 'kasko' | 'trafik_sigortası' | 'hgs' | 'ogs' | 'garanti' | 'kiralama_sözleşmesi' | 'diğer';
  document_name: string;
  file_url: string;
  issue_date?: string;
  expiry_date?: string;
  issuer?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  company_id?: string;
}

export interface VehicleIncident {
  id: string;
  vehicle_id: string;
  incident_type: 'kaza' | 'trafik_cezası' | 'park_cezası' | 'hasar' | 'hırsızlık' | 'arıza' | 'muayene_başarısızlığı';
  incident_date: string;
  description: string;
  location?: string;
  cost?: number;
  fine_amount?: number;
  due_date?: string;
  status: 'beklemede' | 'çözüldü' | 'ödendi' | 'inceleniyor';
  priority: 'düşük' | 'orta' | 'yüksek' | 'acil';
  responsible_person?: string;
  notes?: string;
  attachments?: any[];
  created_at: string;
  updated_at: string;
  company_id?: string;
}

// Utility types for form handling and filters
export type VehicleStatus = 'aktif' | 'pasif' | 'bakım' | 'satıldı' | 'hasar';
export type FuelType = 'benzin' | 'dizel' | 'lpg' | 'elektrik' | 'hibrit';
export type TransmissionType = 'manuel' | 'otomatik' | 'yarı_otomatik';

export type MaintenanceStatus = 'planlandı' | 'devam_ediyor' | 'tamamlandı' | 'iptal';
export type MaintenanceType = 'periyodik_bakım' | 'yağ_değişimi' | 'fren_servisi' | 'lastik_değişimi' | 'muayene' | 'onarım' | 'acil_müdahale';

export type DocumentType = 'ruhsat' | 'sigorta' | 'muayene' | 'egzoz' | 'kasko' | 'trafik_sigortası' | 'hgs' | 'ogs' | 'garanti' | 'kiralama_sözleşmesi' | 'diğer';

export type IncidentType = 'kaza' | 'trafik_cezası' | 'park_cezası' | 'hasar' | 'hırsızlık' | 'arıza' | 'muayene_başarısızlığı';
export type IncidentStatus = 'beklemede' | 'çözüldü' | 'ödendi' | 'inceleniyor';
export type IncidentPriority = 'düşük' | 'orta' | 'yüksek' | 'acil';

// Form interfaces for creating/updating
export interface VehicleFormData {
  plate_number: string;
  brand: string;
  model: string;
  year?: number;
  color?: string;
  fuel_type: FuelType;
  engine_size?: string;
  transmission: TransmissionType;
  vin_number?: string;
  purchase_date?: string;
  purchase_price?: number;
  current_value?: number;
  mileage?: number;
  insurance_company?: string;
  insurance_policy_number?: string;
  insurance_start_date?: string;
  insurance_end_date?: string;
  inspection_date?: string;
  next_inspection_date?: string;
  assigned_driver_id?: string;
  assigned_department?: string;
  location_address?: string;
  notes?: string;
}

export interface MaintenanceFormData {
  vehicle_id: string;
  maintenance_type: string;
  description?: string;
  maintenance_date: string;
  mileage_at_maintenance?: number;
  cost?: number;
  service_provider?: string;
  next_maintenance_date?: string;
  next_maintenance_mileage?: number;
  technician_id?: string;
  notes?: string;
}

export interface FuelFormData {
  vehicle_id: string;
  fuel_date: string;
  liters: number;
  cost_per_liter: number;
  total_cost: number;
  mileage?: number;
  fuel_station?: string;
  notes?: string;
}

export interface DocumentFormData {
  vehicle_id: string;
  document_type: DocumentType;
  document_name: string;
  issue_date?: string;
  expiry_date?: string;
  issuer?: string;
  notes?: string;
}

export interface IncidentFormData {
  vehicle_id: string;
  incident_type: IncidentType;
  incident_date: string;
  description: string;
  location?: string;
  cost?: number;
  fine_amount?: number;
  due_date?: string;
  priority: IncidentPriority;
  responsible_person?: string;
  notes?: string;
}
