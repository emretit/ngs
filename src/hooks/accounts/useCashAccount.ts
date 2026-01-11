import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { CashAccount, Transaction } from "./types";
import { fetchCompanyId, fetchUserInfoFromAuditLogs } from "./utils";

// Cash Account Detail
export function useCashAccountDetail(accountId: string | undefined) {
  return useQuery({
    queryKey: ['cash-account', accountId],
    queryFn: async () => {
      if (!accountId) throw new Error("Hesap ID bulunamadı");

      const companyId = await fetchCompanyId();

      const { data, error } = await supabase
        .from('cash_accounts')
        .select('id, name, description, current_balance, currency, is_active, location, responsible_person, created_at, updated_at')
        .eq('id', accountId)
        .single();

      if (error) throw error;
      if (!data) throw new Error("Hesap bulunamadı");

      return data as CashAccount;
    },
    enabled: !!accountId,
    staleTime: 1000 * 60 * 10, // 10 dakika cache
    gcTime: 1000 * 60 * 60, // 1 saat garbage collection
    retry: 1,
    retryDelay: 500,
  });
}

// Cash Account Transactions
export function useCashAccountTransactions(accountId: string | undefined, limit: number = 20) {
  return useQuery({
    queryKey: ['cash-account-transactions', accountId, limit],
    queryFn: async () => {
      if (!accountId) throw new Error("Hesap ID bulunamadı");

      const companyId = await fetchCompanyId();

      const [cashTransactions, payments] = await Promise.all([
        supabase
          .from('cash_transactions')
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

      if (cashTransactions.error) throw cashTransactions.error;
      if (payments.error) throw payments.error;

      // Fetch user info from audit logs
      const cashTransactionIds = (cashTransactions.data || []).map((t: any) => t.id);
      const paymentIds = (payments.data || []).map((p: any) => p.id);

      const [cashUserInfo, paymentUserInfo] = await Promise.all([
        fetchUserInfoFromAuditLogs('cash_transactions', cashTransactionIds),
        fetchUserInfoFromAuditLogs('payments', paymentIds)
      ]);

      const userInfoMap = { ...cashUserInfo, ...paymentUserInfo };

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
        user_name: userInfoMap[payment.id] || null
      }));

      const allTransactions = [
        ...cashTransactions.data.map(t => ({ ...t, reference: t.reference || null, user_name: userInfoMap[t.id] || null })),
        ...formattedPayments.map(p => ({ ...p, reference: null }))
      ].sort((a, b) =>
        new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
      );

      return allTransactions.slice(0, limit);
    },
    enabled: !!accountId,
    staleTime: 1000 * 60 * 5, // 5 dakika cache
    gcTime: 1000 * 60 * 30, // 30 dakika garbage collection
    retry: 1,
    retryDelay: 500,
  });
}
