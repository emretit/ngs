export type EmployeeTransactionType =
  | 'tahakkuk'    // Maaş tahakkuku
  | 'odeme'       // Yapılan ödeme
  | 'masraf'      // Çalışan masrafı
  | 'avans'       // Avans ödemesi
  | 'prim'        // Prim/ikramiye
  | 'kesinti';    // Kesinti

export interface UnifiedEmployeeTransaction {
  id: string;
  date: string;
  type: EmployeeTransactionType;
  amount: number;
  description: string;
  reference?: string;
  category?: string;
  status: 'beklemende' | 'tamamlandi' | 'iptal';
  balanceAfter?: number;
  paymentMethod?: string;
  paymentAccountId?: string;
  paymentAccountType?: 'cash' | 'bank' | 'credit_card' | 'partner';

  // Masraf için
  expense_id?: string;
  is_paid?: boolean;

  // Ödeme için
  payment_date?: string;
}

export interface EmployeeSalaryStats {
  totalAccrued: number;      // Toplam tahakkuk eden
  totalPaid: number;         // Toplam ödenen
  pendingBalance: number;    // Bekleyen bakiye
  lastPaymentDate: string | null; // Son ödeme tarihi
}
