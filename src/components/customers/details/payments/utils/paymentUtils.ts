import { Payment } from "@/types/payment";
import { useExchangeRates } from "@/hooks/useExchangeRates";

export type TransactionType = 'payment' | 'sales_invoice' | 'purchase_invoice' | 'check';

export interface UnifiedTransaction {
  id: string;
  type: TransactionType;
  date: string;
  amount: number;
  direction: 'incoming' | 'outgoing';
  description: string;
  reference?: string;
  currency: string;
  status?: string;
  payment?: Payment;
  paymentType?: string;
  dueDate?: string;
  branch?: string;
  balanceAfter?: number;
}

export const getTransactionTypeLabel = (
  type: TransactionType, 
  direction?: 'incoming' | 'outgoing', 
  paymentType?: string
): string => {
  if (type === 'payment') {
    // Fiş işlemleri için özel etiket
    if (paymentType === 'fis') {
      // Müşteri için: outgoing = borç fişi (müşteriye borç yazıyoruz), incoming = alacak fişi (müşteriye alacak yazıyoruz)
      return direction === 'outgoing' ? 'Borç Fişi' : 'Alacak Fişi';
    }
    // Diğer ödeme türleri
    if (direction === 'incoming') {
      return 'Gelen Ödeme';
    } else if (direction === 'outgoing') {
      return 'Giden Ödeme';
    }
    return 'Ödeme';
  }

  if (type === 'check') {
    if (direction === 'incoming') {
      return 'Alınan Çek';
    } else if (direction === 'outgoing') {
      return 'Verilen Çek';
    }
    return 'Çek';
  }

  const labels: Record<TransactionType, string> = {
    payment: 'Ödeme',
    sales_invoice: 'Satış Faturası',
    purchase_invoice: 'Alış Faturası',
    check: 'Çek',
  };
  return labels[type];
};

export const getAccountName = (payment: Payment): string => {
  if (payment.accounts) {
    const account = payment.accounts;
    if (account.account_type === 'bank' && account.bank_name) {
      return `${account.name} - ${account.bank_name}`;
    }
    return account.name;
  }
  // Fallback: account_id ve account_type varsa manuel olarak çek
  if (payment.account_id && (payment as any).account_type) {
    return `${(payment as any).account_type} Hesabı`;
  }
  return "Bilinmeyen Hesap";
};

export const getUsdAmount = (
  amount: number, 
  currency: string,
  usdRate: number,
  convertCurrency: (amount: number, from: string, to: string) => number
): number => {
  if (currency === 'USD') return amount;
  if (currency === 'TRY') return amount / usdRate;
  return convertCurrency(amount, currency, 'USD');
};

export const getCreditDebit = (
  transaction: UnifiedTransaction,
  usdRate: number,
  convertCurrency: (amount: number, from: string, to: string) => number
) => {
  // Fiş işlemleri için özel mantık
  if (transaction.type === 'payment' && transaction.paymentType === 'fis') {
    // Müşteri için: Borç fişi (outgoing) = müşteri bize borçlu → Borç kolonunda
    // Müşteri için: Alacak fişi (incoming) = müşteri bizden alacaklı → Alacak kolonunda
    if (transaction.direction === 'outgoing') {
      // Borç fişi → Borç kolonunda
      return {
        credit: 0,
        debit: transaction.amount,
        usdCredit: 0,
        usdDebit: getUsdAmount(transaction.amount, transaction.currency, usdRate, convertCurrency),
      };
    } else {
      // Alacak fişi → Alacak kolonunda
      return {
        credit: transaction.amount,
        debit: 0,
        usdCredit: getUsdAmount(transaction.amount, transaction.currency, usdRate, convertCurrency),
        usdDebit: 0,
      };
    }
  }
  
  // Diğer işlemler için mevcut mantık
  if (transaction.direction === 'incoming') {
    // Gelen ödemeler ve satış faturaları → Alacak
    return {
      credit: transaction.amount,
      debit: 0,
      usdCredit: getUsdAmount(transaction.amount, transaction.currency, usdRate, convertCurrency),
      usdDebit: 0,
    };
  } else {
    // Giden ödemeler ve alış faturaları → Borç
    return {
      credit: 0,
      debit: transaction.amount,
      usdCredit: 0,
      usdDebit: getUsdAmount(transaction.amount, transaction.currency, usdRate, convertCurrency),
    };
  }
};

