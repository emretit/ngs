import { useEffect, useRef } from 'react';
import { logger } from '@/utils/logger';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Real-time subscription options
 */
export interface RealtimeSubscriptionOptions {
  /**
   * Table name to subscribe to
   */
  table: string;
  
  /**
   * Company ID to filter changes (required for security)
   */
  companyId: string | null | undefined;
  
  /**
   * Events to listen to (default: ['INSERT', 'UPDATE', 'DELETE'])
   */
  events?: ('INSERT' | 'UPDATE' | 'DELETE')[];
  
  /**
   * Query keys to invalidate when changes occur
   */
  queryKeys: (string | number | boolean | null | undefined)[][];
  
  /**
   * Custom callback when change occurs
   */
  onChange?: (payload: {
    eventType: 'INSERT' | 'UPDATE' | 'DELETE';
    new?: any;
    old?: any;
  }) => void;
  
  /**
   * Channel name (auto-generated if not provided)
   */
  channelName?: string;
  
  /**
   * Additional filter (e.g., "status=eq.active")
   */
  filter?: string;
  
  /**
   * Schema name (default: 'public')
   */
  schema?: string;
}

/**
 * Hook for subscribing to real-time changes in Supabase tables
 * 
 * Automatically handles:
 * - Company ID filtering for security
 * - Query invalidation
 * - Channel cleanup
 * 
 * @example
 * ```typescript
 * useRealtimeSubscription({
 *   table: 'proposals',
 *   companyId: userData?.company_id,
 *   queryKeys: [['proposals'], ['proposals-list']],
 *   onChange: (payload) => {
 *     logger.debug('Proposal changed:', payload);
 *   }
 * });
 * ```
 */
export function useRealtimeSubscription(options: RealtimeSubscriptionOptions) {
  const queryClient = useQueryClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    // Don't subscribe if company ID is not available
    if (!options.companyId) {
      return;
    }

    const channelName = options.channelName || `${options.table}-changes-${options.companyId}`;
    const schema = options.schema || 'public';
    const events = options.events || ['INSERT', 'UPDATE', 'DELETE'];

    // Create filter string with company_id
    const companyFilter = `company_id=eq.${options.companyId}`;
    const filter = options.filter 
      ? `${companyFilter},${options.filter}`
      : companyFilter;

    // Create channel
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events, filter by events array in callback
          schema,
          table: options.table,
          filter,
        },
        (payload) => {
          // Only process events we're interested in
          if (events.includes(payload.eventType as any)) {
            // Invalidate all specified query keys
            options.queryKeys.forEach(queryKey => {
              queryClient.invalidateQueries({ 
                queryKey,
                exact: false // Invalidate all related queries
              });
            });

            // Call custom callback if provided
            if (options.onChange) {
              options.onChange({
                eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
                new: payload.new,
                old: payload.old,
              });
            }
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    // Cleanup function
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [
    options.table,
    options.companyId,
    options.queryKeys.join(','), // Convert array to string for dependency
    options.events?.join(','),
    options.filter,
    options.schema,
    queryClient,
  ]);
}

/**
 * Hook for subscribing to multiple tables at once
 * 
 * @example
 * ```typescript
 * useMultipleRealtimeSubscriptions([
 *   {
 *     table: 'proposals',
 *     companyId: userData?.company_id,
 *     queryKeys: [['proposals']]
 *   },
 *   {
 *     table: 'orders',
 *     companyId: userData?.company_id,
 *     queryKeys: [['orders']]
 *   }
 * ]);
 * ```
 */
export function useMultipleRealtimeSubscriptions(
  subscriptions: Omit<RealtimeSubscriptionOptions, 'onChange'>[]
) {
  subscriptions.forEach(sub => {
    useRealtimeSubscription(sub);
  });
}

