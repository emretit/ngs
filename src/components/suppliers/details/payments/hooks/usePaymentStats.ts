import { useMemo, useEffect, useRef } from "react";
import { UnifiedTransaction, PaymentStats, CreditDebitResult } from "../types";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";

interface UsePaymentStatsProps {
  allTransactions: UnifiedTransaction[];
  getCreditDebit: (transaction: UnifiedTransaction) => CreditDebitResult;
  supplierId?: string;
  companyId?: string;
}

export const usePaymentStats = ({ 
  allTransactions, 
  getCreditDebit,
  supplierId,
  companyId
}: UsePaymentStatsProps): PaymentStats => {
  const lastBalanceRef = useRef<number | null>(null);

  const stats = useMemo(() => {
    // Tüm işlemleri tarihe göre sırala
    const sorted = [...allTransactions].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateA === dateB ? a.id.localeCompare(b.id) : dateA - dateB;
    });

    let totalIncoming = 0;
    let totalOutgoing = 0;
    let balance = 0;

    sorted.forEach((transaction) => {
      const { credit, debit } = getCreditDebit(transaction);
      totalIncoming += credit;
      totalOutgoing += debit;
      // Tedarikçi bakış açısından: Borç (debit) bakiye artırır, Alacak (credit) bakiye azaltır
      // Alacak = Tedarikçiye borcumuz var → Bakiye azalır (daha negatif olur)
      // Borç = Tedarikçiden alacağımız var veya ödeme yaptık → Bakiye artar
      balance = balance + debit - credit;
    });

    return {
      totalIncoming,
      totalOutgoing,
      currentBalance: balance,
    };
  }, [allTransactions, getCreditDebit]);

  // Bakiye değiştiğinde veritabanına kaydet
  useEffect(() => {
    if (!supplierId || !companyId) return;
    
    // Bakiye değişmemişse kaydetme
    if (lastBalanceRef.current === stats.currentBalance) return;
    
    // İlk render'da lastBalanceRef null olabilir, bu durumda kaydet
    const shouldUpdate = lastBalanceRef.current === null || lastBalanceRef.current !== stats.currentBalance;
    
    if (shouldUpdate) {
      // Önce ref'i güncelle ki tekrar kaydetmesin
      lastBalanceRef.current = stats.currentBalance;
      
      // Veritabanına kaydet
      supabase
        .from('suppliers')
        .update({ balance: stats.currentBalance })
        .eq('id', supplierId)
        .eq('company_id', companyId)
        .then(({ error }) => {
          if (error) {
            logger.error('Error updating supplier balance:', error);
            // Hata durumunda ref'i geri al
            lastBalanceRef.current = null;
          } else {
            logger.debug(`✅ Supplier balance updated for ${supplierId}: ${stats.currentBalance}`);
          }
        });
    }
  }, [stats.currentBalance, supplierId, companyId]);

  return stats;
};
