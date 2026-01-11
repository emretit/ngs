import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { CreditCard, Transaction } from "./types";
import { fetchUserInfoFromAuditLogs } from "./utils";

export function useCreditCardDetail(cardId: string | undefined) {
  return useQuery({
    queryKey: ['credit-card', cardId],
    queryFn: async () => {
      if (!cardId) throw new Error("Kart ID bulunamadı");

      const { data, error } = await supabase
        .from('credit_cards')
        .select('id, card_name, card_number, card_type, bank_name, current_balance, credit_limit, available_limit, status, expiry_date, currency, notes, payment_due_date, minimum_payment, last_payment_date, is_active, created_at, updated_at')
        .eq('id', cardId)
        .single();

      if (error) throw error;
      if (!data) throw new Error("Kart bulunamadı");

      return data as CreditCard;
    },
    enabled: !!cardId,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 60,
    retry: 1,
    retryDelay: 500,
  });
}

export function useCreditCardTransactions(cardId: string | undefined, limit: number = 20) {
  return useQuery({
    queryKey: ['credit-card-transactions', cardId, limit],
    queryFn: async () => {
      if (!cardId) throw new Error("Kart ID bulunamadı");

      const [cardTransactions, payments] = await Promise.all([
        supabase
          .from('card_transactions')
          .select('*')
          .eq('card_id', cardId)
          .order('transaction_date', { ascending: false })
          .limit(limit),
        
        supabase
          .from('payments')
          .select(`
            *,
            customer:customers(name),
            supplier:suppliers(name)
          `)
          .eq('account_id', cardId)
          .eq('account_type', 'credit_card')
          .order('payment_date', { ascending: false })
          .limit(limit)
      ]);

      if (cardTransactions.error) throw cardTransactions.error;
      if (payments.error) throw payments.error;
      
      const cardTransactionIds = (cardTransactions.data || []).map((t: any) => t.id);
      const paymentIds = (payments.data || []).map((p: any) => p.id);
      
      const [cardUserInfo, paymentUserInfo] = await Promise.all([
        fetchUserInfoFromAuditLogs('card_transactions', cardTransactionIds),
        fetchUserInfoFromAuditLogs('payments', paymentIds)
      ]);

      const userInfoMap = { ...cardUserInfo, ...paymentUserInfo };
      
      const mappedCardTransactions = (cardTransactions.data || []).map((item: any) => ({
        ...item,
        type: (item.transaction_type === 'payment' || item.transaction_type === 'refund') ? 'income' : 'expense',
        category: item.merchant_category || item.category || 'Genel',
        description: item.description || item.merchant_name || 'Kart İşlemi',
        reference: item.reference || null,
        user_name: userInfoMap[item.id] || null
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
        reference: null,
        user_name: userInfoMap[payment.id] || null
      }));

      const allTransactions = [
        ...mappedCardTransactions,
        ...formattedPayments
      ].sort((a, b) => 
        new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
      );

      return allTransactions.slice(0, limit) as Transaction[];
    },
    enabled: !!cardId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    retry: 1,
    retryDelay: 500,
  });
}
