import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { PaymentAccount } from "./types";
import { fetchCompanyId } from "./utils";

export function usePaymentCashAccounts() {
  return useQuery({
    queryKey: ['payment-cash-accounts'],
    queryFn: async () => {
      const companyId = await fetchCompanyId();
      const { data, error } = await supabase
        .from('cash_accounts')
        .select('id, name')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return (data || []).map(a => ({ id: a.id, label: a.name }));
    },
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
  });
}

export function usePaymentBankAccounts() {
  return useQuery({
    queryKey: ['payment-bank-accounts'],
    queryFn: async () => {
      const companyId = await fetchCompanyId();
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('id, account_name, bank_name')
        .eq('is_active', true)
        .order('account_name');
      
      if (error) throw error;
      return (data || []).map(a => ({ 
        id: a.id, 
        label: `${a.account_name}${a.bank_name ? ` - ${a.bank_name}` : ''}` 
      }));
    },
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
  });
}

export function usePaymentCreditCards() {
  return useQuery({
    queryKey: ['payment-credit-cards'],
    queryFn: async () => {
      const companyId = await fetchCompanyId();
      const { data, error } = await supabase
        .from('credit_cards')
        .select('id, card_name')
        .eq('status', 'active')
        .order('card_name');
      
      if (error) throw error;
      return (data || []).map(a => ({ id: a.id, label: a.card_name }));
    },
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
  });
}

export function usePaymentPartnerAccounts() {
  return useQuery({
    queryKey: ['payment-partner-accounts'],
    queryFn: async () => {
      const companyId = await fetchCompanyId();
      const { data, error } = await supabase
        .from('partner_accounts')
        .select('id, partner_name')
        .eq('is_active', true)
        .order('partner_name');
      
      if (error) throw error;
      return (data || []).map(a => ({ id: a.id, label: a.partner_name }));
    },
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
  });
}

export function useAllPaymentAccounts() {
  const { data: cashAccounts = [], isLoading: isLoadingCash } = usePaymentCashAccounts();
  const { data: bankAccounts = [], isLoading: isLoadingBank } = usePaymentBankAccounts();
  const { data: creditCards = [], isLoading: isLoadingCredit } = usePaymentCreditCards();
  const { data: partnerAccounts = [], isLoading: isLoadingPartner } = usePaymentPartnerAccounts();

  return {
    cashAccounts,
    bankAccounts,
    creditCards,
    partnerAccounts,
    isLoading: isLoadingCash || isLoadingBank || isLoadingCredit || isLoadingPartner,
    getAccountName: (accountType: string, accountId: string): string => {
      if (!accountType || !accountId) return '-';
      
      switch (accountType) {
        case 'cash':
          return cashAccounts.find(acc => acc.id === accountId)?.label || '-';
        case 'bank':
          return bankAccounts.find(acc => acc.id === accountId)?.label || '-';
        case 'credit_card':
          return creditCards.find(acc => acc.id === accountId)?.label || '-';
        case 'partner':
          return partnerAccounts.find(acc => acc.id === accountId)?.label || '-';
        default:
          return '-';
      }
    },
    getAccountsByType: (type: string): PaymentAccount[] => {
      switch (type) {
        case 'cash':
          return cashAccounts;
        case 'bank':
          return bankAccounts;
        case 'credit_card':
          return creditCards;
        case 'partner':
          return partnerAccounts;
        default:
          return [];
      }
    },
  };
}
