import { useMemo } from "react";
import { UnifiedEmployeeTransaction } from "@/types/employee-transactions";

interface RawTransaction {
  source: 'employee' | 'expense' | 'cash' | 'bank' | 'card' | 'partner';
  data: any;
}

export const useUnifiedEmployeeTransactions = (rawTransactions: RawTransaction[]) => {
  return useMemo<UnifiedEmployeeTransaction[]>(() => {
    const unified: UnifiedEmployeeTransaction[] = [];

    rawTransactions.forEach((raw) => {
      switch (raw.source) {
        case 'employee': {
          // Maaş tahakkuku
          const emp = raw.data;
          unified.push({
            id: `salary-${emp.id}`,
            date: emp.effective_date,
            type: 'tahakkuk',
            amount: emp.net_salary,
            description: `Maaş Tahakkuku - ${new Date(emp.effective_date).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}`,
            status: 'tamamlandi',
            category: 'maaş',
            reference: emp.id,
          });
          break;
        }

        case 'expense': {
          // Çalışan masrafı
          const expense = raw.data;
          unified.push({
            id: `expense-${expense.id}`,
            date: expense.date,
            type: 'masraf',
            amount: expense.amount,
            description: expense.description || 'Masraf',
            status: expense.is_paid ? 'tamamlandi' : 'beklemende',
            category: expense.category?.name || 'Genel Masraf',
            reference: `EXP-${expense.id}`,
            expense_id: expense.id,
            is_paid: expense.is_paid,
            payment_date: expense.paid_date,
            paymentAccountType: expense.payment_account_type,
            paymentAccountId: expense.payment_account_id,
          });
          break;
        }

        case 'cash': {
          // Kasa ödemesi
          const tx = raw.data;
          unified.push({
            id: `cash-${tx.id}`,
            date: tx.transaction_date,
            type: 'odeme',
            amount: tx.amount,
            description: tx.description || 'Ödeme',
            status: 'tamamlandi',
            category: 'Kasa Ödemesi',
            reference: tx.reference,
            paymentMethod: 'Kasa',
            paymentAccountType: 'cash',
            paymentAccountId: tx.account_id,
          });
          break;
        }

        case 'bank': {
          // Banka ödemesi
          const tx = raw.data;
          unified.push({
            id: `bank-${tx.id}`,
            date: tx.transaction_date,
            type: 'odeme',
            amount: tx.amount,
            description: tx.description || 'Ödeme',
            status: 'tamamlandi',
            category: 'Banka Ödemesi',
            reference: tx.reference,
            paymentMethod: 'Banka',
            paymentAccountType: 'bank',
            paymentAccountId: tx.account_id,
          });
          break;
        }

        case 'card': {
          // Kredi kartı ödemesi
          const tx = raw.data;
          unified.push({
            id: `card-${tx.id}`,
            date: tx.transaction_date,
            type: 'odeme',
            amount: tx.amount,
            description: tx.description || 'Ödeme',
            status: 'tamamlandi',
            category: 'Kredi Kartı Ödemesi',
            reference: tx.reference_number,
            paymentMethod: 'Kredi Kartı',
            paymentAccountType: 'credit_card',
            paymentAccountId: tx.card_id,
          });
          break;
        }

        case 'partner': {
          // Ortak hesap ödemesi
          const tx = raw.data;
          unified.push({
            id: `partner-${tx.id}`,
            date: tx.transaction_date,
            type: 'odeme',
            amount: tx.amount,
            description: tx.description || 'Ödeme',
            status: 'tamamlandi',
            category: 'Ortak Hesap Ödemesi',
            reference: tx.reference,
            paymentMethod: 'Ortak Hesap',
            paymentAccountType: 'partner',
            paymentAccountId: tx.partner_id,
          });
          break;
        }
      }
    });

    // Tarihe göre sırala (en yeni en üstte)
    return unified.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (dateA === dateB) {
        return a.id.localeCompare(b.id);
      }
      return dateB - dateA;
    });
  }, [rawTransactions]);
};
