import { useState, useCallback, useEffect, memo, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import InventoryTransactionsHeader from "@/components/inventory/InventoryTransactionsHeader";
import InventoryTransactionsFilterBar from "@/components/inventory/InventoryTransactionsFilterBar";
import InventoryTransactionsContent from "@/components/inventory/InventoryTransactionsContent";
import InventoryTransactionsBulkActions from "@/components/inventory/InventoryTransactionsBulkActions";
import StockEntryExitDialog from "@/components/inventory/StockEntryExitDialog";
import StockTransferDialog from "@/components/inventory/StockTransferDialog";
import { useInventoryTransactions } from "@/hooks/useInventoryTransactions";
import { InventoryTransaction } from "@/types/inventory";
import { toast } from "sonner";

interface InventoryTransactionsProps {
  isCollapsed?: boolean;
  setIsCollapsed?: (collapsed: boolean) => void;
}

const InventoryTransactions = ({ isCollapsed, setIsCollapsed }: InventoryTransactionsProps) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [warehouseFilter, setWarehouseFilter] = useState("all");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  
  // URL'den product_id parametresini al
  const productIdFromUrl = searchParams.get("product_id");
  
  // Debounced search query
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [sortField, setSortField] = useState<"transaction_number" | "transaction_date" | "transaction_type" | "status">("transaction_date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [selectedTransactions, setSelectedTransactions] = useState<InventoryTransaction[]>([]);
  const [isStockDialogOpen, setIsStockDialogOpen] = useState(false);
  const [stockDialogType, setStockDialogType] = useState<'giris' | 'cikis'>('giris');
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);

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
    filters, 
    setFilters,
    refetch,
    approveTransaction,
    cancelTransaction,
  } = useInventoryTransactions();

  // Filtreleri hook'a aktar
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      transaction_type: typeFilter === "all" ? undefined : typeFilter as any,
      status: statusFilter === "all" ? undefined : statusFilter as any,
      warehouse_id: warehouseFilter === "all" ? undefined : warehouseFilter,
      product_id: productIdFromUrl || undefined,
      search: debouncedSearchQuery,
      dateRange: {
        from: startDate || null,
        to: endDate || null,
      },
    }));
  }, [debouncedSearchQuery, typeFilter, statusFilter, warehouseFilter, startDate, endDate, productIdFromUrl, setFilters]);

  const handleSort = useCallback((field: "transaction_number" | "transaction_date" | "transaction_type" | "status") => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection(field === "transaction_date" ? "desc" : "asc");
    }
  }, [sortField, sortDirection]);

  const handleTransactionClick = useCallback((transaction: InventoryTransaction) => {
    // Panel açılması InventoryTransactionsContent içinde handleSelectTransaction ile yapılıyor
    // Bu fonksiyon artık kullanılmıyor ama prop olarak geçiliyor, boş bırakıyoruz
  }, []);

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

  const handleCreateTransaction = useCallback((type: 'giris' | 'cikis' | 'transfer' | 'sayim') => {
    if (type === 'giris' || type === 'cikis') {
      setStockDialogType(type);
      setIsStockDialogOpen(true);
    } else if (type === 'transfer') {
      setIsTransferDialogOpen(true);
    } else {
      // Sayım için sayfa navigasyonu
      navigate(`/inventory/transactions/${type}/new`);
    }
  }, [navigate]);

  const handleEdit = useCallback((transaction: InventoryTransaction) => {
    const type = transaction.transaction_type;
    if (type === 'giris' || type === 'cikis') {
      // Giriş/Çıkış için dialog aç
      setStockDialogType(type);
      setIsStockDialogOpen(true);
    } else {
      navigate(`/inventory/transactions/${type}/${transaction.id}/edit`);
    }
  }, [navigate]);

  const handleDelete = useCallback(async (transaction: InventoryTransaction) => {
    if (window.confirm(`${transaction.transaction_number} numaralı işlemi silmek istediğinize emin misiniz?`)) {
      try {
        // TODO: Delete functionality - şimdilik sadece toast göster
        toast.error("Silme işlemi yakında eklenecek");
      } catch (error) {
        toast.error("İşlem silinirken hata oluştu");
      }
    }
  }, []);

  const handleApprove = useCallback(async (transaction: InventoryTransaction) => {
    try {
      await approveTransaction(transaction.id);
      toast.success("İşlem onaylandı ve stok güncellendi");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "İşlem onaylanırken hata oluştu");
    }
  }, [approveTransaction, refetch]);

  const handleCancel = useCallback(async (transaction: InventoryTransaction) => {
    if (window.confirm(`${transaction.transaction_number} numaralı işlemi iptal etmek istediğinize emin misiniz?`)) {
      try {
        await cancelTransaction(transaction.id);
        toast.success("İşlem iptal edildi");
        refetch();
      } catch (error: any) {
        toast.error(error.message || "İşlem iptal edilirken hata oluştu");
      }
    }
  }, [cancelTransaction, refetch]);

  const handlePrint = useCallback((transaction: InventoryTransaction) => {
    // TODO: Print functionality
    toast.info("Yazdırma işlemi yakında eklenecek");
  }, []);


  // İlk yükleme sırasında loading göster (hook'lardan SONRA kontrol et)
  if (isLoading && !transactions) {
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
        activeView="table"
        sortField={sortField}
        sortDirection={sortDirection}
        onSortFieldChange={handleSort}
        onSelectTransaction={handleTransactionClick}
        onTransactionSelect={handleTransactionSelect}
        selectedTransactions={selectedTransactions}
        searchQuery={searchQuery}
        typeFilter={typeFilter}
        statusFilter={statusFilter}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onApprove={handleApprove}
        onCancel={handleCancel}
        onPrint={handlePrint}
      />
      )}

      {/* Stok Giriş/Çıkış Dialog */}
      <StockEntryExitDialog
        isOpen={isStockDialogOpen}
        onClose={() => setIsStockDialogOpen(false)}
        transactionType={stockDialogType}
        onSuccess={() => {
          refetch();
        }}
      />

      {/* Depo Transferi Dialog */}
      <StockTransferDialog
        isOpen={isTransferDialogOpen}
        onClose={() => setIsTransferDialogOpen(false)}
        onSuccess={() => {
          refetch();
        }}
      />
    </div>
  );
};

export default memo(InventoryTransactions);
