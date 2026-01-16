import { Payment } from "@/types/payment";

export type TransactionType = 'payment' | 'purchase_invoice' | 'sales_invoice';

export interface UnifiedTransaction {
  id: string;
  type: TransactionType;
  date: string;
  amount: number;
  direction: 'incoming' | 'outgoing';
  description: string;
  reference?: string;
  currency: string;
  exchange_rate?: number | null;
  status?: string;
  payment?: Payment & { account_name?: string; exchange_rate?: number | null };
  paymentType?: string;
  dueDate?: string;
  branch?: string;
  balanceAfter?: number;
  usdBalanceAfter?: number;
  check?: {
    id: string;
    check_number: string;
    bank: string;
    due_date: string;
    status: string;
  } | null;
}

export interface CreditDebitResult {
  credit: number;
  debit: number;
  usdCredit: number;
  usdDebit: number;
}

export interface PaymentStats {
  totalIncoming: number;
  totalOutgoing: number;
  currentBalance: number;
}
