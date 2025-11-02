import React from "react";
import InventoryTransactionsTable from "./InventoryTransactionsTable";
import { InventoryTransaction } from "@/types/inventory";

interface InventoryTransactionsContentProps {
  transactions: InventoryTransaction[];
  isLoading: boolean;
  error: any;
  onSelectTransaction: (transaction: InventoryTransaction) => void;
  searchQuery?: string;
  typeFilter?: string;
  statusFilter?: string;
}

const InventoryTransactionsContent = ({
  transactions,
  isLoading,
  error,
  onSelectTransaction,
  searchQuery,
  typeFilter,
  statusFilter
}: InventoryTransactionsContentProps) => {
  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-red-500">İşlemler yüklenirken bir hata oluştu.</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="p-6 bg-white rounded-xl relative overflow-hidden">
        <div className="relative z-10">
          <InventoryTransactionsTable
            transactions={transactions}
            isLoading={isLoading}
            onSelectTransaction={onSelectTransaction}
            searchQuery={searchQuery}
            typeFilter={typeFilter}
            statusFilter={statusFilter}
          />
        </div>
      </div>
    </div>
  );
};

export default InventoryTransactionsContent;

