import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { TransferTransaction } from "./types";

export function useAccountTransfers(accountType: string, accountId: string | undefined, limit: number = 20) {
  return useQuery({
    queryKey: ['account-transfers', accountType, accountId, limit],
    queryFn: async () => {
      if (!accountId) throw new Error("Hesap ID bulunamadı");

      const [outgoingTransfers, incomingTransfers] = await Promise.all([
        supabase
          .from('account_transfers')
          .select(`
            *,
            to_account_name:to_account_id
          `)
          .eq('from_account_type', accountType)
          .eq('from_account_id', accountId)
          .order('transfer_date', { ascending: false })
          .limit(limit),
        
        supabase
          .from('account_transfers')
          .select(`
            *,
            from_account_name:from_account_id
          `)
          .eq('to_account_type', accountType)
          .eq('to_account_id', accountId)
          .order('transfer_date', { ascending: false })
          .limit(limit)
      ]);

      if (outgoingTransfers.error) throw outgoingTransfers.error;
      if (incomingTransfers.error) throw incomingTransfers.error;

      const allTransfers = [
        ...(outgoingTransfers.data || []).map(transfer => ({
          ...transfer,
          direction: 'outgoing' as const
        })),
        ...(incomingTransfers.data || []).map(transfer => ({
          ...transfer,
          direction: 'incoming' as const
        }))
      ].sort((a, b) => new Date(b.transfer_date).getTime() - new Date(a.transfer_date).getTime());

      return allTransfers.slice(0, limit) as (TransferTransaction & { direction: 'incoming' | 'outgoing' })[];
    },
    enabled: !!accountId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    retry: 1,
    retryDelay: 500,
  });
}
