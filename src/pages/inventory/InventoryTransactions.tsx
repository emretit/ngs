import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import InventoryTransactionsHeader from "@/components/inventory/InventoryTransactionsHeader";
import InventoryTransactionsFilterBar from "@/components/inventory/InventoryTransactionsFilterBar";
import InventoryTransactionsContent from "@/components/inventory/InventoryTransactionsContent";
import { useInventoryTransactions } from "@/hooks/useInventoryTransactions";
import { InventoryTransaction } from "@/types/inventory";

interface InventoryTransactionsProps {
  isCollapsed?: boolean;
  setIsCollapsed?: (collapsed: boolean) => void;
}

const InventoryTransactions = ({ isCollapsed, setIsCollapsed }: InventoryTransactionsProps) => {
  const navigate = useNavigate();
  const { 
    transactions, 
    isLoading, 
    stats,
    filters, 
    setFilters,
  } = useInventoryTransactions();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [warehouseFilter, setWarehouseFilter] = useState("all");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  const handleTransactionClick = (transaction: InventoryTransaction) => {
    navigate(`/inventory/transactions/${transaction.id}`);
  };

  const handleCreateTransaction = (type: string) => {
    navigate(`/inventory/transactions/${type}/new`);
  };

  // Filtreleri hook'a aktar
  useEffect(() => {
    setFilters({
      ...filters,
      transaction_type: typeFilter === "all" ? undefined : typeFilter as any,
      status: statusFilter === "all" ? undefined : statusFilter as any,
      warehouse_id: warehouseFilter === "all" ? undefined : warehouseFilter,
      search: searchQuery,
      dateRange: {
        from: startDate || null,
        to: endDate || null,
      },
    });
  }, [searchQuery, typeFilter, statusFilter, warehouseFilter, startDate, endDate]);

  return (
    <div className="space-y-2">
      <InventoryTransactionsHeader 
        stats={stats}
        transactions={transactions}
        onCreateTransaction={handleCreateTransaction}
      />
      <InventoryTransactionsFilterBar 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedType={typeFilter}
        setSelectedType={setTypeFilter}
        selectedStatus={statusFilter}
        setSelectedStatus={setStatusFilter}
        selectedWarehouse={warehouseFilter}
        setSelectedWarehouse={setWarehouseFilter}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
      />
      <InventoryTransactionsContent
        transactions={transactions}
        isLoading={isLoading}
        error={null}
        onSelectTransaction={handleTransactionClick}
        searchQuery={searchQuery}
        typeFilter={typeFilter}
        statusFilter={statusFilter}
      />
    </div>
  );
};

export default InventoryTransactions;
