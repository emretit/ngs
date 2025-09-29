import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface BankAccount {
  id: string;
  account_name: string;
  bank_name: string;
  account_type: string;
  currency: string;
  current_balance: number;
  available_balance: number;
  is_active: boolean;
}

interface CreditCard {
  id: string;
  card_name: string;
  card_type: string;
  current_balance: number;
  credit_limit: number;
  available_limit: number;
  status: string;
  expiry_date: string;
}

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

export function useBankAccounts() {
  return useQuery({
    queryKey: ['bank-accounts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('is_active', true)
        .order('bank_name', { ascending: true });

      if (error) throw error;
      return (data as unknown as BankAccount[]) || [];
    },
    staleTime: 1000 * 60 * 5, // 5 dakika cache
    gcTime: 1000 * 60 * 30, // 30 dakika garbage collection
  });
}

export function useCreditCards() {
  return useQuery({
    queryKey: ['credit-cards'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('credit_cards')
        .select('*')
        .eq('status', 'active')
        .order('card_name', { ascending: true });

      if (error) throw error;
      return (data as unknown as CreditCard[]) || [];
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
}

export function useCashAccounts() {
  return useQuery({
    queryKey: ['cash-accounts'],
    queryFn: async () => {
      const companyId = await fetchCompanyId();

      const { data, error } = await supabase
        .from('cash_accounts')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data as unknown as CashAccount[]) || [];
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
}

export function usePartnerAccounts() {
  return useQuery({
    queryKey: ['partner-accounts'],
    queryFn: async () => {
      const companyId = await fetchCompanyId();

      const { data, error } = await supabase
        .from('partner_accounts')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data as unknown as PartnerAccount[]) || [];
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
}

// Tüm hesapları tek seferde çek (paralel)
export function useAllAccounts() {
  const bankAccounts = useBankAccounts();
  const creditCards = useCreditCards();
  const cashAccounts = useCashAccounts();
  const partnerAccounts = usePartnerAccounts();

  return {
    bankAccounts: bankAccounts.data || [],
    creditCards: creditCards.data || [],
    cashAccounts: cashAccounts.data || [],
    partnerAccounts: partnerAccounts.data || [],
    isLoading: bankAccounts.isLoading || creditCards.isLoading || cashAccounts.isLoading || partnerAccounts.isLoading,
    isError: bankAccounts.isError || creditCards.isError || cashAccounts.isError || partnerAccounts.isError,
    refetch: () => {
      bankAccounts.refetch();
      creditCards.refetch();
      cashAccounts.refetch();
      partnerAccounts.refetch();
    }
  };
}
