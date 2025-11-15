import React, { useState } from "react";
import { InventoryTransaction } from "@/types/inventory";
import InventoryTransactionsTable from "./InventoryTransactionsTable";
import InventoryTransactionDetailPanel from "./InventoryTransactionDetailPanel";

interface InventoryTransactionsContentProps {
  transactions: InventoryTransaction[];
  isLoading: boolean;
  isLoadingMore?: boolean;
  hasNextPage?: boolean;
  loadMore?: () => void;
  totalCount?: number;
  error: any;
  activeView: "grid" | "table";
  sortField: "transaction_number" | "transaction_date" | "transaction_type" | "status";
  sortDirection: "asc" | "desc";
  onSortFieldChange: (field: "transaction_number" | "transaction_date" | "transaction_type" | "status") => void;
  onSelectTransaction: (transaction: InventoryTransaction) => void;
  onTransactionSelect: (transaction: InventoryTransaction) => void;
  selectedTransactions?: InventoryTransaction[];
  searchQuery?: string;
  typeFilter?: string;
  statusFilter?: string;
  onEdit?: (transaction: InventoryTransaction) => void;
  onDelete?: (transaction: InventoryTransaction) => void;
  onApprove?: (transaction: InventoryTransaction) => void;
  onCancel?: (transaction: InventoryTransaction) => void;
  onPrint?: (transaction: InventoryTransaction) => void;
}

const InventoryTransactionsContent = ({
  transactions,
  isLoading,
  isLoadingMore = false,
  hasNextPage = false,
  loadMore,
  totalCount,
  error,
  activeView,
  sortField,
  sortDirection,
  onSortFieldChange,
  onSelectTransaction,
  onTransactionSelect,
  selectedTransactions = [],
  searchQuery,
  typeFilter,
  statusFilter,
  onEdit,
  onDelete,
  onApprove,
  onCancel,
  onPrint,
}: InventoryTransactionsContentProps) => {
  const [selectedTransaction, setSelectedTransaction] = useState<InventoryTransaction | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const handleSelectTransaction = (transaction: InventoryTransaction) => {
    setSelectedTransaction(transaction);
    setIsDetailOpen(true);
    if (onSelectTransaction) {
      onSelectTransaction(transaction);
    }
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    setSelectedTransaction(null);
  };

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-red-500">İşlemler yüklenirken bir hata oluştu.</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="pb-6">
        <InventoryTransactionsTable
          transactions={transactions}
          isLoading={isLoading}
          isLoadingMore={isLoadingMore}
          hasNextPage={hasNextPage}
          loadMore={loadMore}
          totalCount={totalCount || 0}
          sortField={sortField}
          sortDirection={sortDirection}
          onSortFieldChange={onSortFieldChange}
          onSelectTransaction={handleSelectTransaction}
          onTransactionSelect={onTransactionSelect}
          selectedTransactions={selectedTransactions}
          onEdit={onEdit}
          onDelete={onDelete}
          onApprove={onApprove}
          onCancel={onCancel}
          onPrint={onPrint}
        />
        
        {/* Tüm işlemler yüklendi mesajı - InventoryTransactionsTable InfiniteScroll kullanıyor, bu yüzden burada sadece mesaj gösteriyoruz */}
        {!hasNextPage && transactions.length > 0 && !isLoading && (
          <div className="text-center py-4 text-sm text-gray-500">
            Tüm işlemler yüklendi
          </div>
        )}
        
        {/* Detail Panel */}
        <InventoryTransactionDetailPanel
          transaction={selectedTransaction}
          isOpen={isDetailOpen}
          onClose={handleCloseDetail}
        />
      </div>
    </div>
  );
};

export default InventoryTransactionsContent;

