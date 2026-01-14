import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { logger } from '@/utils/logger';

export const useTaskRealtime = () => {
  const queryClient = useQueryClient();
  const { userData } = useCurrentUser();

  useEffect(() => {
    // Don't subscribe if company ID is not available
    if (!userData?.company_id) {
      logger.debug('useTaskRealtime: company_id not available, skipping subscription');
      return;
    }

    const channelName = `activities-changes-${userData.company_id}`;
    
    logger.debug(`useTaskRealtime: Subscribing to ${channelName}`);

    // Subscribe to realtime changes for activities with company_id filter
    const subscription = supabase
      .channel(channelName)
      .on('postgres_changes', {
        event: '*', 
        schema: 'public',
        table: 'activities',
        filter: `company_id=eq.${userData.company_id}`
      }, (payload) => {
        logger.debug('useTaskRealtime: Received change', payload);
        // Invalidate and refetch activities query on any change
        queryClient.invalidateQueries({ 
          queryKey: ['activities', userData.company_id],
          exact: false // Invalidate all related queries
        });
      })
      .subscribe();

    // Cleanup subscription when component unmounts
    return () => {
      logger.debug(`useTaskRealtime: Unsubscribing from ${channelName}`);
      supabase.removeChannel(subscription);
    };
  }, [queryClient, userData?.company_id]);
};

export default useTaskRealtime;
