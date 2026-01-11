import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { BankAccount, Transaction } from "./types";
import { fetchUserInfoFromAuditLogs } from "./utils";

// Bank Account Detail
export function useBankAccountDetail(accountId: string | undefined) {
  return useQuery({
    queryKey: ['bank-account', accountId],
    queryFn: async () => {
      if (!accountId) throw new Error("Hesap ID bulunamadı");

      const { data, error } = await supabase
        .from('bank_accounts')
        .select('id, account_name, bank_name, branch_name, account_type, account_number, iban, swift_code, currency, current_balance, available_balance, credit_limit, interest_rate, is_active, start_date, end_date, notes, created_at, updated_at')
        .eq('id', accountId)
        .single();

      if (error) throw error;
      if (!data) throw new Error("Hesap bulunamadı");

      return data as BankAccount;
    },
    enabled: !!accountId,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 60,
    retry: 1,
    retryDelay: 500,
  });
}

// Bank Account Transactions
export function useBankAccountTransactions(accountId: string | undefined, limit: number = 20) {
  return useQuery({
    queryKey: ['bank-account-transactions', accountId, limit],
    queryFn: async () => {
      if (!accountId) throw new Error("Hesap ID bulunamadı");

      const [bankTransactions, payments] = await Promise.all([
        supabase
          .from('bank_transactions')
          .select('*')
          .eq('account_id', accountId)
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

      if (bankTransactions.error) throw bankTransactions.error;
      if (payments.error) throw payments.error;

      const bankTransactionIds = (bankTransactions.data || []).map((t: any) => t.id);
      const paymentIds = (payments.data || []).map((p: any) => p.id);

      const [bankUserInfo, paymentUserInfo] = await Promise.all([
        fetchUserInfoFromAuditLogs('bank_transactions', bankTransactionIds),
        fetchUserInfoFromAuditLogs('payments', paymentIds)
      ]);

      const userInfoMap = { ...bankUserInfo, ...paymentUserInfo };

      const formattedPayments = payments.data.map((payment) => ({
        id: payment.id,
        amount: payment.amount,
        description: payment.description,
        transaction_date: payment.payment_date,
        type: payment.payment_direction === 'incoming' ? 'income' : 'expense',
        currency: payment.currency,
        customer_name: payment.customer?.name,
        supplier_name: payment.supplier?.name,
        payment_direction: payment.payment_direction,
        payment_type: payment.payment_type,
        reference: null,
        user_name: userInfoMap[payment.id] || null
      }));

      const allTransactions = [
        ...bankTransactions.data.map(t => ({ ...t, reference: t.reference || null, user_name: userInfoMap[t.id] || null })),
        ...formattedPayments
      ].sort((a, b) =>
        new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
      );

      return allTransactions.slice(0, limit);
    },
    enabled: !!accountId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    retry: 1,
    retryDelay: 500,
  });
}
