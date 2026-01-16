import { useMemo } from "react";
import { UnifiedTransaction, PaymentStats, CreditDebitResult } from "../types";

interface UsePaymentStatsProps {
  allTransactions: UnifiedTransaction[];
  getCreditDebit: (transaction: UnifiedTransaction) => CreditDebitResult;
}

export const usePaymentStats = ({ 
  allTransactions, 
  getCreditDebit 
}: UsePaymentStatsProps): PaymentStats => {
  return useMemo(() => {
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
      balance = balance + debit - credit;
    });

    return {
      totalIncoming,
      totalOutgoing,
      currentBalance: balance,
    };
  }, [allTransactions, getCreditDebit]);
};
