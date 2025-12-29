import { useMemo } from "react";
import { UnifiedTransaction } from "../utils/paymentUtils";

interface UseTransactionsWithBalanceProps {
  allTransactions: UnifiedTransaction[];
  filteredTransactions: UnifiedTransaction[];
  currentBalance: number;
}

export const useTransactionsWithBalance = ({
  allTransactions,
  filteredTransactions,
  currentBalance,
}: UseTransactionsWithBalanceProps) => {
  return useMemo(() => {
    // ÖNCE: Tüm işlemler için gerçek bakiyeyi hesapla (filtreye bakmaksızın)
    // Tüm işlemleri tarihe göre sırala (en eski en önce)
    const allSortedTransactions = [...allTransactions].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (dateA === dateB) {
        // Aynı tarihte ise, id'ye göre sırala (tutarlılık için)
        return a.id.localeCompare(b.id);
      }
      return dateA - dateB;
    });

    // Mevcut bakiyeden başlayarak geriye doğru başlangıç bakiyesini hesapla
    let initialBalance = currentBalance || 0;
    
    // Tüm balance'a etki eden işlemleri geriye doğru çıkar (tarihe göre sıralı, en yeni en önce)
    const allBalanceAffecting = allSortedTransactions.filter(
      t => t.type === 'payment' || t.type === 'purchase_invoice'
    );
    
    const sortedAllBalanceAffecting = [...allBalanceAffecting].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA; // En yeni en önce
    });

    sortedAllBalanceAffecting.forEach((transaction) => {
      if (transaction.type === 'payment') {
        // Ödeme: giden ödeme balance += amount, geri alırken balance -= amount
        const amount = transaction.direction === 'incoming' 
          ? -Number(transaction.amount)  // Gelen ödeme balance -= amount, geri alırken balance += amount
          : Number(transaction.amount);  // Giden ödeme balance += amount, geri alırken balance -= amount
        initialBalance = initialBalance - amount;
      } else if (transaction.type === 'purchase_invoice') {
        // Alış faturası: balance -= amount (oluşturulduğunda), geri alırken balance += amount
        initialBalance = initialBalance + Number(transaction.amount);
      }
    });
    
    // Şimdi tüm işlemler için gerçek bakiyeyi hesapla
    let runningBalance = initialBalance;
    const balanceMap = new Map<string, number>();

    allSortedTransactions.forEach((transaction) => {
      // İşlem tutarını hesapla - sadece balance'a etki eden işlemler için
      let amount: number = 0;
      if (transaction.type === 'payment') {
        // Ödeme: giden ödeme balance += amount, gelen ödeme balance -= amount
        amount = transaction.direction === 'incoming'
          ? -Number(transaction.amount)  // Gelen ödeme: balance -= amount
          : Number(transaction.amount);   // Giden ödeme: balance += amount
      } else if (transaction.type === 'purchase_invoice') {
        // Alış faturası: balance -= amount (oluşturulduğunda)
        amount = -Number(transaction.amount);
      }
      // Satış faturaları, siparişler, teklifler, servis talepleri balance'a etki etmez (amount = 0)

      // Bu işlemden sonraki bakiye (sadece balance'a etki eden işlemler için)
      runningBalance = runningBalance + amount;
      
      // Her işlem için bakiyeyi map'e kaydet
      balanceMap.set(transaction.id, runningBalance);
    });

    // SONRA: Filtrelenmiş işlemleri al ve gerçek bakiyeleriyle eşleştir
    const filteredSorted = [...filteredTransactions].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (dateA === dateB) {
        return a.id.localeCompare(b.id);
      }
      return dateA - dateB;
    });

    const transactionsWithBalances = filteredSorted.map((transaction) => {
      // Gerçek bakiyeyi map'ten al
      const balanceAfter = balanceMap.get(transaction.id) ?? currentBalance;

      return {
        ...transaction,
        balanceAfter, // Bu işlemden sonraki gerçek bakiye (tüm işlemlere göre)
      };
    });

    // En yeni en üstte olacak şekilde ters çevir
    return transactionsWithBalances.reverse();
  }, [filteredTransactions, allTransactions, currentBalance]);
};

