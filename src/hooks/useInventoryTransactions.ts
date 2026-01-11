// Re-export all inventory transaction hooks for backward compatibility
// This file maintains the original API while using the new modular hooks

import { useInventoryTransactionsList } from "./inventory/useInventoryTransactionsList";
import { useInventoryTransactionCRUD } from "./inventory/useInventoryTransactionCRUD";
import { useInventoryTransactionOperations } from "./inventory/useInventoryTransactionOperations";

export const useInventoryTransactions = () => {
  // List & filters hook
  const {
    transactions,
    isLoading,
    stats,
    filters,
    setFilters,
    refetch,
  } = useInventoryTransactionsList();

  // CRUD operations hook
  const {
    fetchTransactionById,
    createTransaction,
    updateTransaction,
    isCreating,
    isUpdating,
  } = useInventoryTransactionCRUD();

  // Approve/Cancel/Delete operations hook
  const {
    approveTransaction,
    cancelTransaction,
    deleteTransaction,
  } = useInventoryTransactionOperations(fetchTransactionById);

  // Return original API interface
  return {
    transactions,
    isLoading,
    stats,
    filters,
    setFilters,
    refetch,
    fetchTransactionById,
    createTransaction,
    updateTransaction,
    approveTransaction,
    cancelTransaction,
    deleteTransaction,
    isCreating,
    isUpdating,
  };
};

// Re-export individual hooks for direct usage
export { useInventoryTransactionsList } from "./inventory/useInventoryTransactionsList";
export { useInventoryTransactionCRUD } from "./inventory/useInventoryTransactionCRUD";
export { useInventoryTransactionOperations } from "./inventory/useInventoryTransactionOperations";
