
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useTaskRealtime = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Subscribe to realtime changes for tasks
    const subscription = supabase
      .channel('task-changes')
      .on('postgres_changes', {
        event: '*', 
        schema: 'public',
        table: 'tasks'
      }, () => {
        // Invalidate and refetch tasks query on any change
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
      })
      .subscribe();

    // Cleanup subscription when component unmounts
    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient]);
};

export default useTaskRealtime;
