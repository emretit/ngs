import { useState, useCallback, useEffect, memo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import InventoryTransactionsHeader from "@/components/inventory/InventoryTransactionsHeader";
import InventoryTransactionsFilterBar from "@/components/inventory/InventoryTransactionsFilterBar";
import InventoryTransactionsContent from "@/components/inventory/InventoryTransactionsContent";
import InventoryTransactionsBulkActions from "@/components/inventory/InventoryTransactionsBulkActions";
import { useInventoryTransactions } from "@/hooks/useInventoryTransactions";
import { InventoryTransaction } from "@/types/inventory";
import { toast } from "sonner";

interface InventoryTransactionsProps {
  isCollapsed?: boolean;
  setIsCollapsed?: (collapsed: boolean) => void;
}

const InventoryTransactions = ({ isCollapsed, setIsCollapsed }: InventoryTransactionsProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeView, setActiveView] = useState<"grid" | "table">("table");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [warehouseFilter, setWarehouseFilter] = useState("all");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  
  // Debounced search query
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [sortField, setSortField] = useState<"transaction_number" | "transaction_date" | "transaction_type" | "status">("transaction_date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [selectedTransactions, setSelectedTransactions] = useState<InventoryTransaction[]>([]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { 
    transactions, 
    isLoading, 
    stats,
    filters, 
    setFilters,
  } = useInventoryTransactions();

  // Filtreleri hook'a aktar
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      transaction_type: typeFilter === "all" ? undefined : typeFilter as any,
      status: statusFilter === "all" ? undefined : statusFilter as any,
      warehouse_id: warehouseFilter === "all" ? undefined : warehouseFilter,
      search: debouncedSearchQuery,
      dateRange: {
        from: startDate || null,
        to: endDate || null,
      },
    }));
  }, [debouncedSearchQuery, typeFilter, statusFilter, warehouseFilter, startDate, endDate, setFilters]);

  const handleSort = useCallback((field: "transaction_number" | "transaction_date" | "transaction_type" | "status") => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection(field === "transaction_date" ? "desc" : "asc");
    }
  }, [sortField, sortDirection]);

  const handleTransactionClick = useCallback((transaction: InventoryTransaction) => {
    navigate(`/inventory/transactions/${transaction.id}`);
  }, [navigate]);

  const handleTransactionSelect = useCallback((transaction: InventoryTransaction) => {
    setSelectedTransactions(prev => {
      const isSelected = prev.some(t => t.id === transaction.id);
      return isSelected
        ? prev.filter(t => t.id !== transaction.id)
        : [...prev, transaction];
    });
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedTransactions([]);
  }, []);

  const handleBulkAction = useCallback(async (action: string) => {
    if (action === 'export') {
      // TODO: Export functionality
      toast.info("Export işlemi yakında eklenecek");
    } else if (action === 'approve') {
      // TODO: Bulk approve
      toast.info("Toplu onaylama yakında eklenecek");
    } else if (action === 'cancel') {
      // TODO: Bulk cancel
      toast.info("Toplu iptal yakında eklenecek");
    } else {
      console.log('Bulk action:', action, selectedTransactions);
    }
  }, [selectedTransactions]);

  const handleCreateTransaction = useCallback((type: string) => {
    navigate(`/inventory/transactions/${type}/new`);
  }, [navigate]);

  // İlk yükleme sırasında loading göster (hook'lardan SONRA kontrol et)
  if (isLoading && (!transactions || !stats)) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">İşlemler yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <InventoryTransactionsHeader 
        stats={stats}
        transactions={transactions || []}
        activeView={activeView}
        setActiveView={setActiveView}
        onCreateTransaction={handleCreateTransaction}
      />
      
      {/* Filters */}
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
      
      {/* Bulk Actions */}
      <InventoryTransactionsBulkActions 
        selectedTransactions={selectedTransactions}
        onClearSelection={handleClearSelection}
        onBulkAction={handleBulkAction}
      />
      
      {isLoading ? (
        <div className="flex items-center justify-center h-[400px]">
          <div className="text-center space-y-4">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-muted-foreground">İşlemler yükleniyor...</p>
          </div>
        </div>
      ) : (
      <InventoryTransactionsContent
          transactions={transactions || []}
        isLoading={isLoading}
        error={null}
          activeView={activeView}
          sortField={sortField}
          sortDirection={sortDirection}
          onSortFieldChange={handleSort}
        onSelectTransaction={handleTransactionClick}
          onTransactionSelect={handleTransactionSelect}
          selectedTransactions={selectedTransactions}
        searchQuery={searchQuery}
        typeFilter={typeFilter}
        statusFilter={statusFilter}
      />
      )}
    </div>
  );
};

export default memo(InventoryTransactions);
