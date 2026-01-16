import { useState, useMemo, useCallback } from "react";
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
import { usePaymentStats } from "./payments/hooks/usePaymentStats";
import { useDeletePayment } from "./payments/hooks/useDeletePayment";
import { usePaymentsRealtime } from "./payments/hooks/usePaymentsRealtime";
import { ConfirmationDialogComponent } from "@/components/ui/confirmation-dialog";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/useCurrentUser";

interface PaymentsListProps {
  customer: Customer;
  onAddPayment?: (method: { type: "hesap" | "cek" | "senet" }) => void;
}

export const PaymentsList = ({ customer, onAddPayment }: PaymentsListProps) => {
  const [typeFilter, setTypeFilter] = useState<TransactionType | 'all'>('all');
  // Tarih filtresi başlangıçta boş - kullanıcı isterse filtreler
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<Payment | null>(null);
  const [visibleCount, setVisibleCount] = useState(20); // Infinite scroll için
  const { userData } = useCurrentUser();

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
  const allTransactionsWithBalance = useTransactionsWithBalance({
    allTransactions,
    filteredTransactions,
  });

  // Görüntülenen işlemler (infinite scroll için)
  const transactionsWithBalance = useMemo(() => {
    return allTransactionsWithBalance.slice(0, visibleCount);
  }, [allTransactionsWithBalance, visibleCount]);

  // Daha fazla yüklenebilir mi?
  const hasMore = allTransactionsWithBalance.length > visibleCount;

  // Daha fazla yükle
  const loadMore = useCallback(() => {
    setVisibleCount(prev => prev + 20);
  }, []);

  // Payment stats - tüm işlemleri kullan
  const paymentStats = usePaymentStats({ 
    allTransactions,
    customerId: customer.id,
    companyId: userData?.company_id
  });

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
                customerId={customer.id}
              />
            </div>
          </div>
        </div>
        
        {/* Daha Fazla Yükle Butonu */}
        {hasMore && (
          <div className="flex justify-center py-4 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={loadMore}
              className="text-sm"
            >
              Daha Fazla Yükle ({allTransactionsWithBalance.length - visibleCount} işlem kaldı)
            </Button>
          </div>
        )}
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
