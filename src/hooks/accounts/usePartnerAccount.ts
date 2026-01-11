import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { PartnerAccount, Transaction } from "./types";

export function usePartnerAccountDetail(accountId: string | undefined) {
  return useQuery({
    queryKey: ['partner-account', accountId],
    queryFn: async () => {
      if (!accountId) throw new Error("Hesap ID bulunamadı");

      const { data, error } = await supabase
        .from('partner_accounts')
        .select('id, partner_name, partner_type, current_balance, initial_capital, profit_share, ownership_percentage, currency, is_active, investment_date, created_at, updated_at')
        .eq('id', accountId)
        .single();

      if (error) throw error;
      if (!data) throw new Error("Hesap bulunamadı");

      return data as PartnerAccount;
    },
    enabled: !!accountId,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 60,
    retry: 1,
    retryDelay: 500,
  });
}

export function usePartnerAccountTransactions(accountId: string | undefined, limit: number = 20) {
  return useQuery({
    queryKey: ['partner-account-transactions', accountId, limit],
    queryFn: async () => {
      if (!accountId) throw new Error("Hesap ID bulunamadı");

      const [partnerTransactions, payments] = await Promise.all([
        supabase
          .from('partner_transactions')
          .select('*')
          .eq('partner_id', accountId)
          .order('transaction_date', { ascending: false })
          .limit(limit),
        
        supabase
          .from('payments')
          .select(`
            *,
            customer:customers(name),
            supplier:suppliers(name)
          `)
          .eq('account_id', accountId)
          .order('payment_date', { ascending: false })
          .limit(limit)
      ]);

      if (partnerTransactions.error) throw partnerTransactions.error;
      if (payments.error) throw payments.error;
      
      const mappedPartnerTransactions = (partnerTransactions.data || []).map((transaction: any) => ({
        ...transaction,
        type: transaction.type === 'capital_increase' || transaction.type === 'profit_distribution' ? 'income' : 'expense',
        reference: transaction.reference || null
      }));

      const formattedPayments = payments.data.map((payment) => ({
        id: payment.id,
        amount: payment.amount,
        description: payment.description,
        transaction_date: payment.payment_date,
        type: payment.payment_direction === 'incoming' ? 'income' : 'expense',
        category: 'Ödeme',
        currency: payment.currency,
        customer_name: payment.customer?.name,
        supplier_name: payment.supplier?.name,
        payment_direction: payment.payment_direction,
        reference: null
      }));

      const allTransactions = [
        ...mappedPartnerTransactions,
        ...formattedPayments
      ].sort((a, b) => 
        new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
      );
      
      return allTransactions.slice(0, limit) as Transaction[];
    },
    enabled: !!accountId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    retry: 1,
    retryDelay: 500,
  });
}
