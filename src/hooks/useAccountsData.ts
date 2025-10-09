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
  card_number: string;
  card_type: string;
  bank_name: string;
  current_balance: number;
  credit_limit: number;
  available_limit: number;
  currency: string;
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
  partner_type: string;
  account_type: string;
  current_balance: number;
  initial_capital: number;
  profit_share: number;
  ownership_percentage: number;
  currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Company ID cache
let companyIdCache: string | null = null;
let companyIdPromise: Promise<string> | null = null;

async function fetchCompanyId() {
  // Cache'den döndür
  if (companyIdCache) {
    return companyIdCache;
  }

  // Eğer zaten bir request varsa, onu bekle
  if (companyIdPromise) {
    return companyIdPromise;
  }

  // Yeni request başlat
  companyIdPromise = (async () => {
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

    companyIdCache = profile.company_id;
    return profile.company_id;
  })();

  return companyIdPromise;
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
    retry: 2,
    retryDelay: 1000,
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
    retry: 2,
    retryDelay: 1000,
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
    retry: 2,
    retryDelay: 1000,
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
    retry: 2,
    retryDelay: 1000,
  });
}

// Tüm hesapları paralel olarak çeken optimize edilmiş hook
export function useAllAccounts() {
  return useQuery({
    queryKey: ['all-accounts'],
    queryFn: async () => {
      const companyId = await fetchCompanyId();

      // Tüm hesapları paralel olarak çek
      const [bankResult, creditResult, cashResult, partnerResult] = await Promise.all([
        supabase
          .from('bank_accounts')
          .select('*')
          .eq('is_active', true)
          .order('bank_name', { ascending: true }),
        
        supabase
          .from('credit_cards')
          .select('*')
          .eq('status', 'active')
          .order('card_name', { ascending: true }),
        
        supabase
          .from('cash_accounts')
          .select('*')
          .eq('company_id', companyId)
          .eq('is_active', true)
          .order('name', { ascending: true }),
        
        supabase
          .from('partner_accounts')
          .select('*')
          .eq('company_id', companyId)
          .eq('is_active', true)
          .order('partner_name', { ascending: true })
      ]);

      // Hataları kontrol et
      if (bankResult.error) throw bankResult.error;
      if (creditResult.error) throw creditResult.error;
      if (cashResult.error) throw cashResult.error;
      if (partnerResult.error) throw partnerResult.error;

      return {
        bankAccounts: (bankResult.data as unknown as BankAccount[]) || [],
        creditCards: (creditResult.data as unknown as CreditCard[]) || [],
        cashAccounts: (cashResult.data as unknown as CashAccount[]) || [],
        partnerAccounts: (partnerResult.data as unknown as PartnerAccount[]) || [],
      };
    },
    staleTime: 1000 * 60 * 5, // 5 dakika cache
    gcTime: 1000 * 60 * 30, // 30 dakika garbage collection
    retry: 2,
    retryDelay: 1000,
  });
}

