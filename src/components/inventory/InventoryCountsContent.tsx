import React, { useState } from "react";
import { InventoryTransaction } from "@/types/inventory";
import InventoryCountsTable from "./InventoryCountsTable";
import InventoryTransactionDetailPanel from "./InventoryTransactionDetailPanel";

interface InventoryCountsContentProps {
  transactions: InventoryTransaction[];
  isLoading: boolean;
  sortField: "transaction_number" | "transaction_date" | "status";
  sortDirection: "asc" | "desc";
  onSortFieldChange: (field: "transaction_number" | "transaction_date" | "status") => void;
  onSelectTransaction: (transaction: InventoryTransaction) => void;
  onEdit?: (transaction: InventoryTransaction) => void;
  onDelete?: (transaction: InventoryTransaction) => void;
  onApprove?: (transaction: InventoryTransaction) => void;
  onCancel?: (transaction: InventoryTransaction) => void;
  onPrint?: (transaction: InventoryTransaction) => void;
}

const InventoryCountsContent = ({
  transactions,
  isLoading,
  sortField,
  sortDirection,
  onSortFieldChange,
  onSelectTransaction,
  onEdit,
  onDelete,
  onApprove,
  onCancel,
  onPrint,
}: InventoryCountsContentProps) => {
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

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="pb-6">
        <InventoryCountsTable
          transactions={transactions}
          isLoading={isLoading}
          sortField={sortField}
          sortDirection={sortDirection}
          onSortFieldChange={onSortFieldChange}
          onSelectTransaction={handleSelectTransaction}
          onEdit={onEdit}
          onDelete={onDelete}
          onApprove={onApprove}
          onCancel={onCancel}
          onPrint={onPrint}
        />
        
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

export default InventoryCountsContent;
