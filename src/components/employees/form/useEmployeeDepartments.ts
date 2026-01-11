import { useQuery, useQueryClient } from "@tanstack/react-query";
import { logger } from '@/utils/logger';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import type { Department } from "./types";
import { useEffect } from "react";

export const useEmployeeDepartments = () => {
  const { toast } = useToast();
  const { userData } = useCurrentUser();
  const queryClient = useQueryClient();

  const { data: departments = [] } = useQuery({
    queryKey: ['departments', userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) {
        return [];
      }

      const { data, error } = await supabase
        .from('departments')
        .select('id, name, description, created_at')
        
        .order('name', { ascending: true });

      if (error) {
        logger.error('Error fetching departments:', error);
        toast({
          title: "Error",
          description: "Failed to load departments",
          variant: "destructive",
        });
        throw error;
      }

      return (data || []) as Department[];
    },
    enabled: !!userData?.company_id,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Realtime subscription for department changes
  useEffect(() => {
    if (!userData?.company_id) return;

    const channel = supabase
      .channel('departments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'departments',
          filter: `company_id=eq.${userData.company_id}`
        },
        () => {
          // Invalidate and refetch departments when changes occur
          queryClient.invalidateQueries({ queryKey: ['departments', userData.company_id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userData?.company_id, queryClient]);

  return departments;
};
