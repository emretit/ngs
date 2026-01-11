/**
 * @deprecated Bu hook artık kullanımdan kaldırılmıştır.
 * Yeni React Query tabanlı hook'ları kullanın:
 * - usePaymentCashAccounts()
 * - usePaymentBankAccounts()
 * - usePaymentCreditCards()
 * - usePaymentPartnerAccounts()
 * - useAllPaymentAccounts() (tüm hesapları birleştirir)
 * 
 * Import: import { useAllPaymentAccounts } from '@/hooks/useAccountDetail';
 * 
 * Bu hook gelecekteki bir versiyonda kaldırılacaktır.
 */
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PaymentAccount {
  id: string;
  label: string;
}

export function usePaymentAccounts() {
  const [cashAccounts, setCashAccounts] = useState<PaymentAccount[]>([]);
  const [bankAccounts, setBankAccounts] = useState<PaymentAccount[]>([]);
  const [creditCards, setCreditCards] = useState<PaymentAccount[]>([]);
  const [partnerAccounts, setPartnerAccounts] = useState<PaymentAccount[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPaymentAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const [cashRes, bankRes, cardRes, partnerRes] = await Promise.all([
        supabase.from('cash_accounts').select('id, name'),
        supabase.from('bank_accounts').select('id, account_name'),
        supabase.from('credit_cards').select('id, card_name'),
        supabase.from('partner_accounts').select('id, partner_name')
      ]);

      if (!cashRes.error && cashRes.data) {
        setCashAccounts(cashRes.data.map((a: any) => ({ id: a.id, label: a.name })));
      }
      if (!bankRes.error && bankRes.data) {
        setBankAccounts(bankRes.data.map((a: any) => ({ id: a.id, label: a.account_name })));
      }
      if (!cardRes.error && cardRes.data) {
        setCreditCards(cardRes.data.map((a: any) => ({ id: a.id, label: a.card_name })));
      }
      if (!partnerRes.error && partnerRes.data) {
        setPartnerAccounts(partnerRes.data.map((a: any) => ({ id: a.id, label: a.partner_name })));
      }
    } catch (e) {
      console.error('Hesaplar yüklenirken hata:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPaymentAccounts();
  }, [fetchPaymentAccounts]);

  const getAccountName = useCallback((accountType: string, accountId: string) => {
    if (!accountType || !accountId) return '-';
    
    switch (accountType) {
      case 'cash':
        const cashAccount = cashAccounts.find(acc => acc.id === accountId);
        return cashAccount ? cashAccount.label : '-';
      case 'bank':
        const bankAccount = bankAccounts.find(acc => acc.id === accountId);
        return bankAccount ? bankAccount.label : '-';
      case 'credit_card':
        const creditCard = creditCards.find(acc => acc.id === accountId);
        return creditCard ? creditCard.label : '-';
      case 'partner':
        const partnerAccount = partnerAccounts.find(acc => acc.id === accountId);
        return partnerAccount ? partnerAccount.label : '-';
      default:
        return '-';
    }
  }, [cashAccounts, bankAccounts, creditCards, partnerAccounts]);

  const getAccountsByType = useCallback((type: string) => {
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
  }, [cashAccounts, bankAccounts, creditCards, partnerAccounts]);

  return {
    cashAccounts,
    bankAccounts,
    creditCards,
    partnerAccounts,
    loading,
    fetchPaymentAccounts,
    getAccountName,
    getAccountsByType,
  };
}

