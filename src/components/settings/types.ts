
export type UserRole = {
  id: string;
  user_id: string;
  role: 'admin' | 'sales' | 'manager' | 'viewer';
  created_at: string;
};

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

export type UserWithRoles = UserProfile & { user_roles: UserRole[] };
