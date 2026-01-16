import { useMemo, useEffect, useRef } from "react";
import { UnifiedTransaction, getCreditDebit } from "../utils/paymentUtils";
import { useExchangeRates } from "@/hooks/useExchangeRates";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";

interface UsePaymentStatsProps {
  allTransactions: UnifiedTransaction[];
  customerId?: string;
  companyId?: string;
}

export const usePaymentStats = ({ 
  allTransactions, 
  customerId, 
  companyId 
}: UsePaymentStatsProps) => {
  const { exchangeRates, convertCurrency } = useExchangeRates();
  const lastBalanceRef = useRef<number | null>(null);

  const stats = useMemo(() => {
    const usdRate = exchangeRates.find(r => r.currency_code === 'USD')?.forex_selling || 1;

    // Tüm işlemleri tarihe göre sırala (en eski en önce)
    const sorted = [...allTransactions].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateA === dateB ? a.id.localeCompare(b.id) : dateA - dateB;
    });

    let totalIncoming = 0;
    let totalOutgoing = 0;
    let balance = 0;

    sorted.forEach((transaction) => {
      const { credit, debit } = getCreditDebit(transaction, usdRate, convertCurrency);
      totalIncoming += credit;
      totalOutgoing += debit;
      // Müşteri bakış açısından: Borç (debit) bakiye artırır, Alacak (credit) bakiye azaltır
      balance = balance + debit - credit;
    });

    return {
      totalIncoming,
      totalOutgoing,
      currentBalance: balance,
    };
  }, [allTransactions, exchangeRates, convertCurrency]);

  // Bakiye değiştiğinde veritabanına kaydet
  useEffect(() => {
    if (!customerId || !companyId) return;
    
    // Bakiye değişmemişse kaydetme
    if (lastBalanceRef.current === stats.currentBalance) return;
    
    // İlk render'da lastBalanceRef null olabilir, bu durumda kaydet
    const shouldUpdate = lastBalanceRef.current === null || lastBalanceRef.current !== stats.currentBalance;
    
    if (shouldUpdate) {
      // Önce ref'i güncelle ki tekrar kaydetmesin
      lastBalanceRef.current = stats.currentBalance;
      
      // Veritabanına kaydet
      supabase
        .from('customers')
        .update({ balance: stats.currentBalance })
        .eq('id', customerId)
        .eq('company_id', companyId)
        .then(({ error }) => {
          if (error) {
            logger.error('Error updating customer balance:', error);
            // Hata durumunda ref'i geri al
            lastBalanceRef.current = null;
          } else {
            logger.debug(`✅ Customer balance updated for ${customerId}: ${stats.currentBalance}`);
          }
        });
    }
  }, [stats.currentBalance, customerId, companyId]);

  return stats;
};
