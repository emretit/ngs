import { Payment } from "@/types/payment";
import { UnifiedTransaction, CreditDebitResult } from "../types";

export const getTransactionTypeLabel = (
  type: string, 
  direction?: 'incoming' | 'outgoing', 
  paymentType?: string
): string => {
  if (type === 'payment') {
    if (paymentType === 'fis') {
      return direction === 'outgoing' ? 'Borç Fişi' : 'Alacak Fişi';
    }
    if (direction === 'incoming') {
      return 'Gelen Ödeme';
    } else if (direction === 'outgoing') {
      return 'Giden Ödeme';
    }
    return 'Ödeme';
  }
  
  const labels: Record<string, string> = {
    payment: 'Ödeme',
    purchase_invoice: 'Alış Faturası',
    sales_invoice: 'Satış Faturası',
  };
  return labels[type] || type;
};

export const getAccountName = (payment: Payment): string => {
  if (payment.accounts) {
    const account = payment.accounts;
    if (account.account_type === 'bank' && account.bank_name) {
      return `${account.name} - ${account.bank_name}`;
    }
    return account.name;
  }
  if (payment.account_id && (payment as any).account_type) {
    return `${(payment as any).account_type} Hesabı`;
  }
  return "Bilinmeyen Hesap";
};

export const createConvertToTRY = (
  usdRate: number, 
  convertCurrency: (amount: number, from: string, to: string) => number
) => {
  return (amount: number, currency: string, exchangeRate?: number | null): number => {
    if (currency === 'TRY' || currency === 'TL') return amount;
    if (exchangeRate && exchangeRate > 0) return amount * exchangeRate;
    if (currency === 'USD') return amount * usdRate;
    return convertCurrency(amount, currency, 'TRY');
  };
};

export const createConvertToUSD = (
  usdRate: number, 
  convertCurrency: (amount: number, from: string, to: string) => number
) => {
  return (amount: number, currency: string, exchangeRate?: number | null): number => {
    if (currency === 'USD') return amount;
    if (exchangeRate && exchangeRate > 0) {
      const tryAmount = amount * exchangeRate;
      return tryAmount / usdRate;
    }
    if (currency === 'TRY' || currency === 'TL') return amount / usdRate;
    const tryAmount = convertCurrency(amount, currency, 'TRY');
    return tryAmount / usdRate;
  };
};

export const createGetCreditDebit = (
  convertToTRY: (amount: number, currency: string, exchangeRate?: number | null) => number,
  convertToUSD: (amount: number, currency: string, exchangeRate?: number | null) => number
) => {
  return (transaction: UnifiedTransaction): CreditDebitResult => {
    const exchangeRate = transaction.exchange_rate || transaction.payment?.exchange_rate || null;
    const currency = transaction.currency || 'TRY';
    const isTRY = currency === 'TRY' || currency === 'TL';
    
    // Alış faturası: Tedarikçiden mal aldık → Ona borçluyuz → BORÇ
    if (transaction.type === 'purchase_invoice') {
      const tryDebit = convertToTRY(transaction.amount, currency, exchangeRate);
      const usdDebit = isTRY ? 0 : convertToUSD(transaction.amount, currency, exchangeRate);
      return { credit: 0, debit: tryDebit, usdCredit: 0, usdDebit };
    }

    // Satış faturası: Ona mal sattık → Bize borçlu → ALACAK
    if (transaction.type === 'sales_invoice') {
      const tryCredit = convertToTRY(transaction.amount, currency, exchangeRate);
      const usdCredit = isTRY ? 0 : convertToUSD(transaction.amount, currency, exchangeRate);
      return { credit: tryCredit, debit: 0, usdCredit, usdDebit: 0 };
    }

    // Fiş işlemleri
    if (transaction.type === 'payment' && transaction.paymentType === 'fis') {
      if (transaction.direction === 'outgoing') {
        const tryDebit = convertToTRY(transaction.amount, currency, exchangeRate);
        const usdDebit = isTRY ? 0 : convertToUSD(transaction.amount, currency, exchangeRate);
        return { credit: 0, debit: tryDebit, usdCredit: 0, usdDebit };
      } else {
        const tryCredit = convertToTRY(transaction.amount, currency, exchangeRate);
        const usdCredit = isTRY ? 0 : convertToUSD(transaction.amount, currency, exchangeRate);
        return { credit: tryCredit, debit: 0, usdCredit, usdDebit: 0 };
      }
    }

    // Diğer ödemeler
    if (transaction.direction === 'incoming') {
      const tryDebit = convertToTRY(transaction.amount, currency, exchangeRate);
      const usdDebit = isTRY ? 0 : convertToUSD(transaction.amount, currency, exchangeRate);
      return { credit: 0, debit: tryDebit, usdCredit: 0, usdDebit };
    } else {
      const tryCredit = convertToTRY(transaction.amount, currency, exchangeRate);
      const usdCredit = isTRY ? 0 : convertToUSD(transaction.amount, currency, exchangeRate);
      return { credit: tryCredit, debit: 0, usdCredit, usdDebit: 0 };
    }
  };
};
