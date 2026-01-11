
import { useQuery } from "@tanstack/react-query";
import { logger } from '@/utils/logger';
import { supabase } from "@/integrations/supabase/client";

type UserRole = 'admin' | 'sales_rep' | 'technician' | 'support';

export const useRoleCheck = () => {
  const { data: userRoles } = useQuery({
    queryKey: ['userRoles'],
    queryFn: async () => {
      const { data: roles, error } = await supabase
        .from('user_roles')
        .select('role')
        .single();

      if (error) {
        logger.error('Error fetching user roles:', error);
        return null;
      }

      return roles as { role: UserRole } | null;
    }
  });

  const isAdmin = userRoles?.role === 'admin';
  const isSalesRep = userRoles?.role === 'sales_rep';
  const isTechnician = userRoles?.role === 'technician';
  const isSupport = userRoles?.role === 'support';

  return {
    isAdmin,
    isSalesRep,
    isTechnician,
    isSupport,
    userRole: userRoles?.role
  };
};
