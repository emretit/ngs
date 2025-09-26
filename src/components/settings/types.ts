
export type UserRole = {
  id: string;
  user_id: string;
  role: 'admin' | 'sales' | 'manager' | 'viewer';
  created_at: string;
};

export interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  position: string;
  department: string;
  user_id?: string | null;
  company_id?: string;
  created_at?: string;
  updated_at?: string;
}

export type UserProfile = {
  id: string;
  email?: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string | null;
  updated_at: string | null;
  is_active: boolean;
  employee_id?: string;
  company_id?: string;
  employees?: {
    id: string;
    first_name: string;
    last_name: string;
    position: string;
    department: string;
  } | null;
};

export interface UserWithRoles {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string | null;
  is_active?: boolean;
  user_roles: UserRole[];
  employee_id?: string | null;
}

export type UserWithRoles_Old = UserProfile & { user_roles: UserRole[] };
