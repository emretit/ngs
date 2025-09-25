
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useTaskRealtime = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Subscribe to realtime changes for activities
    const subscription = supabase
      .channel('activity-changes')
      .on('postgres_changes', {
        event: '*', 
        schema: 'public',
        table: 'activities'
      }, () => {
        // Invalidate and refetch activities query on any change
        queryClient.invalidateQueries({ queryKey: ['activities'] });
      })
      .subscribe();

    // Cleanup subscription when component unmounts
    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient]);
};

export default useTaskRealtime;
