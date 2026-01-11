import { useQuery } from "@tanstack/react-query";
import { logger } from '@/utils/logger';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/auth/AuthContext";

export const useSuperAdmin = () => {
  const { user } = useAuth();

  const { data: isSuperAdmin, isLoading } = useQuery({
    queryKey: ['superAdmin', user?.id],
    queryFn: async () => {
      if (!user?.id) return false;

      const { data, error } = await supabase
        .from('user_roles')
        .select('is_super_admin')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        logger.error('Error checking super admin status:', error);
        return false;
      }

      return data?.is_super_admin || false;
    },
    enabled: !!user?.id,
  });

  return {
    isSuperAdmin: isSuperAdmin || false,
    isLoading,
  };
};
