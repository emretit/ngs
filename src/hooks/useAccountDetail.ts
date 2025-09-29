import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface CashAccount {
  id: string;
  name: string;
  description?: string;
  current_balance: number;
  currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface BankAccount {
  id: string;
  account_name: string;
  bank_name: string;
  account_type: string;
  account_number: string;
  iban: string;
  currency: string;
  current_balance: number;
  available_balance: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface CreditCard {
  id: string;
  card_name: string;
  card_number: string;
  card_type: string;
  bank_name: string;
  current_balance: number;
  credit_limit: number;
  available_limit: number;
  status: string;
  expiry_date: string;
  created_at: string;
  updated_at: string;
}

interface PartnerAccount {
  id: string;
  partner_name: string;
  account_type: string;
  current_balance: number;
  currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Transaction {
  id: string;
  account_id: string;
  amount: number;
  type: "income" | "expense";
  description: string;
  category: string;
  transaction_date: string;
  reference?: string;
}

async function fetchCompanyId() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Kullanıcı bulunamadı");

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single();

  if (!profile?.company_id) {
    throw new Error("Şirket bilgisi bulunamadı");
  }

  return profile.company_id;
}

// Cash Account Detail
export function useCashAccountDetail(accountId: string | undefined) {
  return useQuery({
    queryKey: ['cash-account', accountId],
    queryFn: async () => {
      if (!accountId) throw new Error("Hesap ID bulunamadı");
      
      const companyId = await fetchCompanyId();

      const { data, error } = await supabase
        .from('cash_accounts')
        .select('*')
        .eq('id', accountId)
        .eq('company_id', companyId)
        .single();

      if (error) throw error;
      if (!data) throw new Error("Hesap bulunamadı");

      return data as CashAccount;
    },
    enabled: !!accountId,
    staleTime: 1000 * 60 * 2, // 2 dakika cache
    gcTime: 1000 * 60 * 10,
  });
}

// Cash Account Transactions
export function useCashAccountTransactions(accountId: string | undefined) {
  return useQuery({
    queryKey: ['cash-account-transactions', accountId],
    queryFn: async () => {
      if (!accountId) throw new Error("Hesap ID bulunamadı");

      const companyId = await fetchCompanyId();

      const { data, error } = await supabase
        .from('cash_transactions')
        .select('*')
        .eq('account_id', accountId)
        .order('transaction_date', { ascending: false })
        .limit(100);

      if (error) throw error;
      return (data as Transaction[]) || [];
    },
    enabled: !!accountId,
    staleTime: 1000 * 60 * 1, // 1 dakika cache
    gcTime: 1000 * 60 * 5,
  });
}

// Bank Account Detail
export function useBankAccountDetail(accountId: string | undefined) {
  return useQuery({
    queryKey: ['bank-account', accountId],
    queryFn: async () => {
      if (!accountId) throw new Error("Hesap ID bulunamadı");

      const { data, error } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('id', accountId)
        .single();

      if (error) throw error;
      if (!data) throw new Error("Hesap bulunamadı");

      return data as BankAccount;
    },
    enabled: !!accountId,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
  });
}

// Bank Account Transactions
export function useBankAccountTransactions(accountId: string | undefined) {
  return useQuery({
    queryKey: ['bank-account-transactions', accountId],
    queryFn: async () => {
      if (!accountId) throw new Error("Hesap ID bulunamadı");

      const { data, error } = await supabase
        .from('bank_transactions')
        .select('*')
        .eq('account_id', accountId)
        .order('transaction_date', { ascending: false })
        .limit(100);

      if (error) throw error;
      return (data as Transaction[]) || [];
    },
    enabled: !!accountId,
    staleTime: 1000 * 60 * 1,
    gcTime: 1000 * 60 * 5,
  });
}

// Credit Card Detail
export function useCreditCardDetail(cardId: string | undefined) {
  return useQuery({
    queryKey: ['credit-card', cardId],
    queryFn: async () => {
      if (!cardId) throw new Error("Kart ID bulunamadı");

      const { data, error } = await supabase
        .from('credit_cards')
        .select('*')
        .eq('id', cardId)
        .single();

      if (error) throw error;
      if (!data) throw new Error("Kart bulunamadı");

      return data as CreditCard;
    },
    enabled: !!cardId,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
  });
}

// Credit Card Transactions
export function useCreditCardTransactions(cardId: string | undefined) {
  return useQuery({
    queryKey: ['credit-card-transactions', cardId],
    queryFn: async () => {
      if (!cardId) throw new Error("Kart ID bulunamadı");

      const { data, error } = await supabase
        .from('credit_card_transactions')
        .select('*')
        .eq('card_id', cardId)
        .order('transaction_date', { ascending: false })
        .limit(100);

      if (error) throw error;
      return (data as Transaction[]) || [];
    },
    enabled: !!cardId,
    staleTime: 1000 * 60 * 1,
    gcTime: 1000 * 60 * 5,
  });
}

// Partner Account Detail
export function usePartnerAccountDetail(accountId: string | undefined) {
  return useQuery({
    queryKey: ['partner-account', accountId],
    queryFn: async () => {
      if (!accountId) throw new Error("Hesap ID bulunamadı");

      const companyId = await fetchCompanyId();

      const { data, error } = await supabase
        .from('partner_accounts')
        .select('*')
        .eq('id', accountId)
        .eq('company_id', companyId)
        .single();

      if (error) throw error;
      if (!data) throw new Error("Hesap bulunamadı");

      return data as PartnerAccount;
    },
    enabled: !!accountId,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
  });
}

// Partner Account Transactions
export function usePartnerAccountTransactions(accountId: string | undefined) {
  return useQuery({
    queryKey: ['partner-account-transactions', accountId],
    queryFn: async () => {
      if (!accountId) throw new Error("Hesap ID bulunamadı");

      const { data, error } = await supabase
        .from('partner_transactions')
        .select('*')
        .eq('account_id', accountId)
        .order('transaction_date', { ascending: false })
        .limit(100);

      if (error) throw error;
      return (data as Transaction[]) || [];
    },
    enabled: !!accountId,
    staleTime: 1000 * 60 * 1,
    gcTime: 1000 * 60 * 5,
  });
}
