import { useState, useMemo, useCallback } from "react";
import { Supplier } from "@/types/supplier";
import { Payment } from "@/types/payment";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useExchangeRates } from "@/hooks/useExchangeRates";
import { ConfirmationDialogComponent } from "@/components/ui/confirmation-dialog";
import { Button } from "@/components/ui/button";

import { TransactionType } from "./payments/types";
import { createConvertToTRY, createConvertToUSD, createGetCreditDebit } from "./payments/utils/paymentUtils";
import { PaymentsHeader } from "./payments/PaymentsHeader";
import { PaymentsTable } from "./payments/PaymentsTable";
import {
  usePaymentsQuery,
  usePurchaseInvoicesQuery,
  useSalesInvoicesQuery,
  usePaymentsRealtime,
  useUnifiedTransactions,
  useFilteredTransactions,
  useTransactionsWithBalance,
  useDeletePayment,
  usePaymentStats,
} from "./payments/hooks";

interface PaymentsListProps {
  supplier: Supplier;
  onAddPayment?: (method: { type: "hesap" | "cek" | "senet" }) => void;
}

export const PaymentsList = ({ supplier, onAddPayment }: PaymentsListProps) => {
  const [typeFilter, setTypeFilter] = useState<TransactionType | 'all'>('all');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<Payment | null>(null);
  const [visibleCount, setVisibleCount] = useState(20);
  
  const { exchangeRates, convertCurrency } = useExchangeRates();
  const { userData, loading: userLoading } = useCurrentUser();
  const isEnabled = !!userData?.company_id && !userLoading;

  // Queries
  const { data: payments = [] } = usePaymentsQuery(supplier, userData?.company_id, isEnabled);
  const { data: purchaseInvoices = [] } = usePurchaseInvoicesQuery(supplier, userData?.company_id, isEnabled);
  const { data: salesInvoices = [] } = useSalesInvoicesQuery(supplier, userData?.company_id, isEnabled);

  // Realtime
  usePaymentsRealtime(supplier, userData?.company_id, isEnabled);

  // USD kuru
  const usdRate = useMemo(() => {
    const rate = exchangeRates.find(r => r.currency_code === 'USD');
    return rate?.forex_selling || 1;
  }, [exchangeRates]);

  // Dönüşüm fonksiyonları
  const convertToTRY = useMemo(() => createConvertToTRY(usdRate, convertCurrency), [usdRate, convertCurrency]);
  const convertToUSD = useMemo(() => createConvertToUSD(usdRate, convertCurrency), [usdRate, convertCurrency]);
  const getCreditDebit = useMemo(() => createGetCreditDebit(convertToTRY, convertToUSD), [convertToTRY, convertToUSD]);

  // İşlem birleştirme ve filtreleme
  const allTransactions = useUnifiedTransactions({ payments, purchaseInvoices, salesInvoices });
  const filteredTransactions = useFilteredTransactions({ allTransactions, typeFilter, startDate, endDate });
  const allTransactionsWithBalance = useTransactionsWithBalance({ allTransactions, filteredTransactions, getCreditDebit });

  // İstatistikler
  const paymentStats = usePaymentStats({ 
    allTransactions, 
    getCreditDebit,
    supplierId: supplier.id,
    companyId: userData?.company_id
  });

  // Silme işlemi
  const deletePaymentMutation = useDeletePayment(supplier, userData?.company_id);

  // Görüntülenen işlemler (infinite scroll)
  const transactionsWithBalance = useMemo(() => {
    return allTransactionsWithBalance.slice(0, visibleCount);
  }, [allTransactionsWithBalance, visibleCount]);

  const hasMore = allTransactionsWithBalance.length > visibleCount;
  const loadMore = useCallback(() => setVisibleCount(prev => prev + 20), []);

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
        supplierId={supplier.id}
        paymentStats={paymentStats}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        onAddPayment={onAddPayment}
      />

      {/* Ekstre Tablosu */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="pb-6">
          <div className="-mx-4">
            <div className="px-4">
              <PaymentsTable
                transactions={transactionsWithBalance}
                getCreditDebit={getCreditDebit}
                isDeleting={deletePaymentMutation.isPending}
                onDelete={handleDeletePayment}
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
