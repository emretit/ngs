
export type EmployeeStatus = 'aktif' | 'pasif';
export type ViewMode = 'table' | 'grid';

export interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  position: string;
  department: string;
  hire_date: string;
  status: EmployeeStatus;
  avatar_url: string | null;
  user_id?: string | null;
  
  // Extended personal information
  date_of_birth?: string | null;
  gender?: 'male' | 'female' | 'other' | null;
  marital_status?: 'single' | 'married' | 'divorced' | 'widowed' | null;
  address?: string | null;
  country?: string | null;
  city?: string | null;
  district?: string | null;
  postal_code?: string | null;
  id_ssn?: string | null;
  
  // New address fields
  city_id?: number | null;
  district_id?: number | null;
  neighborhood_id?: number | null;
  address_line?: string | null;
  address_type?: 'home' | 'work' | 'other' | null;
  
  // Emergency contact
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  emergency_contact_relation?: string | null;
  
  // Salary information
  salary_amount?: number | null;
  salary_currency?: 'TRY' | 'USD' | 'EUR' | 'GBP' | null;
  salary_type?: 'gross' | 'net' | 'hourly' | 'daily' | null;
  payment_frequency?: 'monthly' | 'weekly' | 'daily' | 'hourly' | null;
  salary_start_date?: string | null;
  salary_notes?: string | null;
  
  created_at?: string;
  updated_at?: string;
}

// Form data type with required fields
export interface EmployeeFormData {
  first_name: string;
  last_name: string;
  email: string;
  position: string;
  department: string;
  hire_date: string;
  status: EmployeeStatus;
  phone: string;
  avatar_url: string;
  date_of_birth: string;
  gender: 'male' | 'female' | 'other' | null;
  marital_status: 'single' | 'married' | 'divorced' | 'widowed' | null;
  address: string;
  country: string;
  city: string;
  district: string;
  postal_code: string;
  id_ssn: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relation: string;
}

// Add these types to support components that use them
export interface EmployeeLeave {
  id: string;
  employee_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  status: string;
  notes?: string;
  reason?: string;
  created_at?: string;
}

export interface EmployeeSalary {
  id: string;
  employee_id: string;
  effective_date: string;
  amount: number;
  currency: string;
  type: string;
  gross_salary?: number;
  net_salary?: number;
  allowances?: any;
  created_at?: string;
}
