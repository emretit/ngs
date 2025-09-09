
export interface EmployeeFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  hire_date: string;
  status: 'active' | 'inactive';
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

export interface Department {
  id: string;
  name: string;
}

export type Position = 
  | "Manager" 
  | "Sales Representative" 
  | "Marketing Specialist" 
  | "Developer" 
  | "Designer" 
  | "HR Specialist" 
  | "Customer Support" 
  | "Admin" 
  | "Director" 
  | "Technician";

export const POSITIONS: Position[] = [
  "Manager", 
  "Sales Representative", 
  "Marketing Specialist", 
  "Developer", 
  "Designer", 
  "HR Specialist", 
  "Customer Support", 
  "Admin", 
  "Director", 
  "Technician"
];

// Add missing exports that are used in PersonalInfoExtended
export const GENDERS = ["male", "female", "other"];
export const MARITAL_STATUS = ["single", "married", "divorced", "widowed"];

// Add validation schema that is referenced in useFormValidation
export const formValidationSchema = {
  first_name: { required: true, message: "First name is required" },
  last_name: { required: true, message: "Last name is required" },
  email: { required: true, message: "Email is required" },
  position: { required: true, message: "Role is required" },
  department: { required: true, message: "Department is required" }
};

export const initialFormData: EmployeeFormData = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  position: '',
  department: '',
  hire_date: new Date().toISOString().split('T')[0],
  status: 'active',
  avatar_url: '',
  date_of_birth: '',
  gender: null,
  marital_status: null,
  address: '',
  country: 'Turkey',
  city: '',
  district: '',
  postal_code: '',
  id_ssn: '',
  emergency_contact_name: '',
  emergency_contact_phone: '',
  emergency_contact_relation: ''
};
