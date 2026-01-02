import { useState, useMemo } from "react";
import { Customer } from "@/types/customer";
import { Payment } from "@/types/payment";
import { TransactionType, getCreditDebit } from "./payments/utils/paymentUtils";
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
import { useExchangeRates } from "@/hooks/useExchangeRates";
import { ConfirmationDialogComponent } from "@/components/ui/confirmation-dialog";

interface PaymentsListProps {
  customer: Customer;
  onAddPayment?: (method: { type: "hesap" | "cek" | "senet" }) => void;
}

export const PaymentsList = ({ customer, onAddPayment }: PaymentsListProps) => {
  const [typeFilter, setTypeFilter] = useState<TransactionType | 'all'>('all');
  // Bulunduğu yılın başı için varsayılan tarih filtresi
  const [startDate, setStartDate] = useState<Date | undefined>(() => {
    const now = new Date();
    const yearStart = new Date(now.getFullYear(), 0, 1); // Yılın ilk günü (1 Ocak)
    return yearStart;
  });
  const [endDate, setEndDate] = useState<Date | undefined>(() => new Date());
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<Payment | null>(null);

  // Customer balance
  const currentBalance = useCustomerBalance(customer);

  // Exchange rates
  const { exchangeRates, convertCurrency } = useExchangeRates();

  // Data queries - çekler artık payments tablosunda payment_type='cek' olarak tutuluyor
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
    customerId: customer.id,
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

  // Gerçek bakiye: Tüm işlemlerdeki en son (en yeni) işlemin bakiyesi
  const calculatedBalance = useMemo(() => {
    const usdRate = exchangeRates.find(r => r.currency_code === 'USD')?.forex_selling || 1;

    // Tüm işlemleri tarihe göre sırala (en eski en önce)
    const sorted = [...allTransactions].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateA === dateB ? a.id.localeCompare(b.id) : dateA - dateB;
    });

    // Bakiye hesapla
    let balance = 0;
    sorted.forEach((transaction) => {
      const { credit, debit } = getCreditDebit(transaction, usdRate, convertCurrency);
      balance = balance + debit - credit;
    });

    return balance;
  }, [allTransactions, exchangeRates, convertCurrency]);

  // Payment stats - hesaplanan bakiyeyi kullan
  const paymentStats = usePaymentStats(payments, calculatedBalance);

  // Delete payment mutation
  const deletePaymentMutation = useDeletePayment(customer);

  const handleDeletePayment = (payment: Payment) => {
    setPaymentToDelete(payment);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (paymentToDelete) {
      deletePaymentMutation.mutate(paymentToDelete);
      setIsDeleteDialogOpen(false);
      setPaymentToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false);
    setPaymentToDelete(null);
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

      {/* Confirmation Dialog */}
      <ConfirmationDialogComponent
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Ödemeyi Sil"
        description={
          paymentToDelete
            ? `Bu ${paymentToDelete.payment_type === 'fis' ? 'fiş' : 'ödeme'}i silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`
            : "Bu ödemeyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
        }
        confirmText="Sil"
        cancelText="İptal"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        isLoading={deletePaymentMutation.isPending}
      />
    </div>
  );
};
