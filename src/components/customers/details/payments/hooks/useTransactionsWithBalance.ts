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
    // İşlemleri tarihe göre sırala (en eski en üstte)
    const sortedTransactions = [...filteredTransactions].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (dateA === dateB) {
        // Aynı tarihte ise, id'ye göre sırala (tutarlılık için)
        return a.id.localeCompare(b.id);
      }
      return dateA - dateB;
    });

    // Filtrelenmiş işlemlerin en eski tarihini bul
    const oldestFilteredDate = sortedTransactions.length > 0 
      ? new Date(sortedTransactions[0].date).getTime()
      : null;

    // Filtrelenmiş işlemlerin en eskisinden ÖNCEKİ tüm işlemleri al (başlangıç bakiyesi için)
    const transactionsBeforeFilter = oldestFilteredDate
      ? allTransactions.filter(t => new Date(t.date).getTime() < oldestFilteredDate)
      : [];

    // Sadece balance'a etki eden işlemleri filtrele (filtrelenmiş + öncesi)
    const allBalanceAffectingTransactions = [
      ...transactionsBeforeFilter.filter(t => t.type === 'payment' || t.type === 'purchase_invoice'),
      ...sortedTransactions.filter(t => t.type === 'payment' || t.type === 'purchase_invoice')
    ];

    // Mevcut bakiyeden başlayarak geriye doğru başlangıç bakiyesini hesapla
    let initialBalance = currentBalance || 0;
    
    // Tüm balance'a etki eden işlemleri geriye doğru çıkar (tarihe göre sıralı, en yeni en önce)
    const sortedAllBalanceAffecting = [...allBalanceAffectingTransactions].sort((a, b) => {
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
    
    // Şimdi en eski işlemden başlayarak ileriye doğru bakiyeyi hesapla
    let runningBalance = initialBalance;

    const transactionsWithBalances = sortedTransactions.map((transaction) => {
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

      return {
        ...transaction,
        balanceAfter: runningBalance, // Bu işlemden sonraki bakiye
      };
    });

    // En yeni en üstte olacak şekilde ters çevir
    return transactionsWithBalances.reverse();
  }, [filteredTransactions, allTransactions, currentBalance]);
};

