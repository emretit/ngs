
export type UserRole = {
  id: string;
  user_id: string;
  role: 'admin' | 'sales' | 'manager' | 'viewer';
  created_at: string;
};

export type UserProfile = {
  id: string;
  email?: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  created_at: string | null;
  updated_at: string | null;
  is_active: boolean;
};

export type UserWithRoles = UserProfile & { user_roles: UserRole[] };
