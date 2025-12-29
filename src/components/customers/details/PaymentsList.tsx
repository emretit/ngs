import { useState } from "react";
import { Customer } from "@/types/customer";
import { Payment } from "@/types/payment";
import { TransactionType } from "./payments/utils/paymentUtils";
import { PaymentsHeader } from "./payments/PaymentsHeader";
import { PaymentsTable } from "./payments/PaymentsTable";
import { usePaymentsQuery } from "./payments/hooks/usePaymentsQuery";
import { useSalesInvoicesQuery } from "./payments/hooks/useSalesInvoicesQuery";
import { usePurchaseInvoicesQuery } from "./payments/hooks/usePurchaseInvoicesQuery";
import { useUnifiedTransactions } from "./payments/hooks/useUnifiedTransactions";
import { useFilteredTransactions } from "./payments/hooks/useFilteredTransactions";
import { useTransactionsWithBalance } from "./payments/hooks/useTransactionsWithBalance";
import { useCustomerBalance } from "./payments/hooks/useCustomerBalance";
import { usePaymentStats } from "./payments/hooks/usePaymentStats";
import { useDeletePayment } from "./payments/hooks/useDeletePayment";
import { usePaymentsRealtime } from "./payments/hooks/usePaymentsRealtime";

interface PaymentsListProps {
  customer: Customer;
  onAddPayment?: (method: { type: "hesap" | "cek" | "senet" }) => void;
}

export const PaymentsList = ({ customer, onAddPayment }: PaymentsListProps) => {
  const [typeFilter, setTypeFilter] = useState<TransactionType | 'all'>('all');
  // Son 30 gün için varsayılan tarih filtresi
  const [startDate, setStartDate] = useState<Date | undefined>(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date;
  });
  const [endDate, setEndDate] = useState<Date | undefined>(() => new Date());

  // Customer balance
  const currentBalance = useCustomerBalance(customer);

  // Data queries
  const { data: payments = [] } = usePaymentsQuery(customer);
  const { data: salesInvoices = [] } = useSalesInvoicesQuery(customer);
  const { data: purchaseInvoices = [] } = usePurchaseInvoicesQuery(customer);

  // Realtime subscriptions
  usePaymentsRealtime(customer);

  // Unified transactions
  const allTransactions = useUnifiedTransactions({
    payments,
    salesInvoices,
    purchaseInvoices,
  });

  // Filtered transactions
  const filteredTransactions = useFilteredTransactions({
    allTransactions,
    typeFilter,
    startDate,
    endDate,
  });

  // Transactions with balance
  const transactionsWithBalance = useTransactionsWithBalance({
    allTransactions,
    filteredTransactions,
    currentBalance,
  });

  // Payment stats
  const paymentStats = usePaymentStats(payments, currentBalance);

  // Delete payment mutation
  const deletePaymentMutation = useDeletePayment(customer);

  const handleDeletePayment = (payment: Payment) => {
    const paymentTypeLabel = payment.payment_type === 'fis' ? 'fiş' : 'ödeme';
    if (window.confirm(`Bu ${paymentTypeLabel}i silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`)) {
      deletePaymentMutation.mutate(payment);
    }
  };

  return (
    <div className="space-y-4">
      <PaymentsHeader
        paymentStats={paymentStats}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
        startDate={startDate}
        onStartDateChange={setStartDate}
        endDate={endDate}
        onEndDateChange={setEndDate}
        onAddPayment={onAddPayment}
        customerId={customer.id}
      />

      {/* Ekstre Tablosu */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="pb-6">
          <div className="-mx-4">
            <div className="px-4">
              <PaymentsTable
                transactions={transactionsWithBalance}
                onDelete={handleDeletePayment}
                isDeleting={deletePaymentMutation.isPending}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
