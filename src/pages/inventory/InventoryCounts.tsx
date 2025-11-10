import { useState, useCallback, useEffect, memo, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import InventoryCountsHeader from "@/components/inventory/InventoryCountsHeader";
import InventoryCountsFilterBar from "@/components/inventory/InventoryCountsFilterBar";
import InventoryCountsContent from "@/components/inventory/InventoryCountsContent";
import { useInventoryTransactions } from "@/hooks/useInventoryTransactions";
import { InventoryTransaction } from "@/types/inventory";
import { toast } from "sonner";

interface InventoryCountsProps {
  isCollapsed?: boolean;
  setIsCollapsed?: (collapsed: boolean) => void;
}

const InventoryCounts = ({ isCollapsed, setIsCollapsed }: InventoryCountsProps) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [warehouseFilter, setWarehouseFilter] = useState("all");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  
  // Debounced search query
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [sortField, setSortField] = useState<"transaction_number" | "transaction_date" | "status">("transaction_date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { 
    transactions, 
    isLoading, 
    filters, 
    setFilters,
    refetch,
    approveTransaction,
    cancelTransaction,
  } = useInventoryTransactions();

  // Filtreleri hook'a aktar - tek useEffect ile optimize edildi
  useEffect(() => {
    setFilters({
      transaction_type: 'sayim' as any,
      status: statusFilter === "all" ? undefined : statusFilter as any,
      warehouse_id: warehouseFilter === "all" ? undefined : warehouseFilter,
      search: debouncedSearchQuery,
      dateRange: {
        from: startDate || null,
        to: endDate || null,
      },
      page: 1,
      pageSize: 20,
    });
  }, [debouncedSearchQuery, statusFilter, warehouseFilter, startDate, endDate, setFilters]);

  const handleSort = useCallback((field: "transaction_number" | "transaction_date" | "status") => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection(field === "transaction_date" ? "desc" : "asc");
    }
  }, [sortField, sortDirection]);

  const handleTransactionClick = useCallback((transaction: InventoryTransaction) => {
    // Panel açılması InventoryCountsContent içinde handleSelectTransaction ile yapılıyor
    // Bu fonksiyon artık kullanılmıyor ama prop olarak geçiliyor, boş bırakıyoruz
  }, []);

  const handleNewCount = () => {
    navigate("/inventory/transactions/sayim/new");
  };

  const handleEdit = useCallback((transaction: InventoryTransaction) => {
    navigate(`/inventory/transactions/sayim/${transaction.id}/edit`);
  }, [navigate]);

  const handleDelete = useCallback(async (transaction: InventoryTransaction) => {
    if (window.confirm(`${transaction.transaction_number} numaralı sayımı silmek istediğinize emin misiniz?`)) {
      try {
        // TODO: Delete functionality - şimdilik sadece toast göster
        toast.error("Silme işlemi yakında eklenecek");
      } catch (error) {
        toast.error("Sayım silinirken hata oluştu");
      }
    }
  }, []);

  const handleApprove = useCallback(async (transaction: InventoryTransaction) => {
    try {
      await approveTransaction(transaction.id);
      toast.success("Sayım onaylandı ve stok güncellendi");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Sayım onaylanırken hata oluştu");
    }
  }, [approveTransaction, refetch]);

  const handleCancel = useCallback(async (transaction: InventoryTransaction) => {
    if (window.confirm(`${transaction.transaction_number} numaralı sayımı iptal etmek istediğinize emin misiniz?`)) {
      try {
        await cancelTransaction(transaction.id);
        toast.success("Sayım iptal edildi");
        refetch();
      } catch (error: any) {
        toast.error(error.message || "Sayım iptal edilirken hata oluştu");
      }
    }
  }, [cancelTransaction, refetch]);

  const handlePrint = useCallback((transaction: InventoryTransaction) => {
    // TODO: Print functionality
    toast.info("Yazdırma işlemi yakında eklenecek");
  }, []);

  // Sıralanmış transaction'lar - useMemo ile optimize edildi
  const sortedTransactions = useMemo(() => {
    const countTransactions = transactions || [];
    return [...countTransactions].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case "transaction_number":
          aValue = a.transaction_number || "";
          bValue = b.transaction_number || "";
          break;
        case "transaction_date":
          aValue = new Date(a.transaction_date).getTime();
          bValue = new Date(b.transaction_date).getTime();
          break;
        case "status":
          aValue = a.status || "";
          bValue = b.status || "";
          break;
        default:
          return 0;
      }

      if (sortDirection === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [transactions, sortField, sortDirection]);

  // İlk yükleme sırasında loading göster
  if (isLoading && !transactions) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Sayımlar yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <InventoryCountsHeader 
        onCreateCount={handleNewCount}
      />
      
      {/* Filters */}
      <InventoryCountsFilterBar 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedStatus={statusFilter}
        setSelectedStatus={setStatusFilter}
        selectedWarehouse={warehouseFilter}
        setSelectedWarehouse={setWarehouseFilter}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
      />
      
      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center h-[400px]">
          <div className="text-center space-y-4">
            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-muted-foreground">Sayımlar yükleniyor...</p>
          </div>
        </div>
      ) : (
        <InventoryCountsContent
          transactions={sortedTransactions}
          isLoading={isLoading}
          sortField={sortField}
          sortDirection={sortDirection}
          onSortFieldChange={handleSort}
          onSelectTransaction={handleTransactionClick}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onApprove={handleApprove}
          onCancel={handleCancel}
          onPrint={handlePrint}
        />
      )}
    </div>
  );
};

export default memo(InventoryCounts);
