
export interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  position: string;
  department: string;
  hire_date: string;
  status: 'active' | 'inactive' | 'aktif' | 'pasif';
  email: string;
  phone: string | null;
  avatar_url: string | null;
  
  // Extended personal information
  date_of_birth?: string | null;
  gender?: string | null;
  marital_status?: string | null;
  address?: string | null;
  country?: string | null;
  city?: string | null;
  district?: string | null;
  postal_code?: string | null;
  id_ssn?: string | null;
  
  // Emergency contact
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  emergency_contact_relation?: string | null;
}

export type ViewMode = 'table' | 'grid';
