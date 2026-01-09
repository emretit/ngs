import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  current_balance: number;
  initial_capital: number;
  profit_share: number;
  ownership_percentage: number;
  currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Query keys for better cache management
export const accountQueryKeys = {
  all: ['accounts'] as const,
  bankAccounts: () => [...accountQueryKeys.all, 'bank-accounts'] as const,
  creditCards: () => [...accountQueryKeys.all, 'credit-cards'] as const,
  cashAccounts: () => [...accountQueryKeys.all, 'cash-accounts'] as const,
  partnerAccounts: () => [...accountQueryKeys.all, 'partner-accounts'] as const,
  allAccounts: () => [...accountQueryKeys.all, 'all-accounts'] as const,
} as const;

// Common query options for consistency
const COMMON_QUERY_OPTIONS = {
  staleTime: 1000 * 60 * 5, // 5 dakika cache
  gcTime: 1000 * 60 * 30, // 30 dakika garbage collection
  retry: 2,
  retryDelay: 1000,
} as const;

export function useBankAccounts() {
  return useQuery({
    queryKey: accountQueryKeys.bankAccounts(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('id, account_name, bank_name, account_type, currency, current_balance, available_balance, is_active, iban')
        .eq('is_active', true)
        .order('bank_name', { ascending: true });

      if (error) throw error;
      return (data as unknown as BankAccount[]) || [];
    },
    enabled: true, // RLS otomatik olarak company_id filtreler
    ...COMMON_QUERY_OPTIONS,
  });
}

export function useCreditCards() {
  return useQuery({
    queryKey: accountQueryKeys.creditCards(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('credit_cards')
        .select('id, card_name, card_number, card_type, bank_name, current_balance, credit_limit, available_limit, currency, status, expiry_date')
        .eq('status', 'active')
        .order('card_name', { ascending: true });

      if (error) throw error;
      return (data as unknown as CreditCard[]) || [];
    },
    enabled: true, // RLS otomatik olarak company_id filtreler
    ...COMMON_QUERY_OPTIONS,
  });
}

export function useCashAccounts() {
  return useQuery({
    queryKey: accountQueryKeys.cashAccounts(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cash_accounts')
        .select('id, name, description, current_balance, currency, is_active, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data as unknown as CashAccount[]) || [];
    },
    enabled: true, // RLS otomatik olarak company_id filtreler
    ...COMMON_QUERY_OPTIONS,
  });
}

export function usePartnerAccounts() {
  return useQuery({
    queryKey: accountQueryKeys.partnerAccounts(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partner_accounts')
        .select('id, partner_name, partner_type, current_balance, initial_capital, profit_share, ownership_percentage, currency, is_active, created_at, updated_at')
        .eq('is_active', true)
        .order('partner_name', { ascending: true });

      if (error) throw error;
      return (data as unknown as PartnerAccount[]) || [];
    },
    enabled: true, // RLS otomatik olarak company_id filtreler
    ...COMMON_QUERY_OPTIONS,
  });
}

// Tüm hesapları paralel olarak çeken optimize edilmiş hook
export function useAllAccounts() {
  return useQuery({
    queryKey: accountQueryKeys.allAccounts(),
    queryFn: async () => {
      // Tüm hesapları paralel olarak çek
      const [bankResult, creditResult, cashResult, partnerResult] = await Promise.all([
        supabase
          .from('bank_accounts')
          .select('id, account_name, bank_name, account_type, currency, current_balance, available_balance, is_active, iban')
          .eq('is_active', true)
          .order('bank_name', { ascending: true }),
        
        supabase
          .from('credit_cards')
          .select('id, card_name, card_number, card_type, bank_name, current_balance, credit_limit, available_limit, currency, status, expiry_date')
          .eq('status', 'active')
          .order('card_name', { ascending: true }),
        
        supabase
          .from('cash_accounts')
          .select('id, name, description, current_balance, currency, is_active, created_at')
          .eq('is_active', true)
          .order('name', { ascending: true }),
        
        supabase
          .from('partner_accounts')
          .select('id, partner_name, partner_type, current_balance, initial_capital, profit_share, ownership_percentage, currency, is_active, created_at, updated_at')
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
    enabled: true, // RLS otomatik olarak company_id filtreler
    ...COMMON_QUERY_OPTIONS,
  });
}

// Optimize edilmiş silme hook'ları - useMutation ile
export function useDeleteCashAccount() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("cash_accounts")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      // Cache'i otomatik güncelle
      queryClient.invalidateQueries({ queryKey: accountQueryKeys.cashAccounts() });
      queryClient.invalidateQueries({ queryKey: accountQueryKeys.allAccounts() });
      toast.success("Nakit hesabı başarıyla silindi");
    },
    onError: (error: any) => {
      toast.error("Hesap silinirken bir hata oluştu: " + (error.message || "Bilinmeyen hata"));
    },
  });
}

export function useDeleteCreditCard() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("credit_cards")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountQueryKeys.creditCards() });
      queryClient.invalidateQueries({ queryKey: accountQueryKeys.allAccounts() });
      toast.success("Kredi kartı başarıyla silindi");
    },
    onError: (error: any) => {
      toast.error("Kart silinirken bir hata oluştu: " + (error.message || "Bilinmeyen hata"));
    },
  });
}

export function useDeletePartnerAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("partner_accounts")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountQueryKeys.partnerAccounts() });
      queryClient.invalidateQueries({ queryKey: accountQueryKeys.allAccounts() });
      toast.success("Ortak hesabı başarıyla silindi");
    },
    onError: (error: any) => {
      toast.error("Hesap silinirken bir hata oluştu: " + (error.message || "Bilinmeyen hata"));
    },
  });
}

export function useDeleteBankAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("bank_accounts")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountQueryKeys.bankAccounts() });
      queryClient.invalidateQueries({ queryKey: accountQueryKeys.allAccounts() });
      toast.success("Banka hesabı başarıyla silindi");
    },
    onError: (error: any) => {
      toast.error("Hesap silinirken bir hata oluştu: " + (error.message || "Bilinmeyen hata"));
    },
  });
}

