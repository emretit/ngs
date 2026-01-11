import { useState, useCallback, useEffect, memo, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import InventoryTransactionsHeader from "@/components/inventory/InventoryTransactionsHeader";
import InventoryTransactionsFilterBar from "@/components/inventory/InventoryTransactionsFilterBar";
import InventoryTransactionsContent from "@/components/inventory/InventoryTransactionsContent";
import InventoryTransactionsBulkActions from "@/components/inventory/InventoryTransactionsBulkActions";
import StockEntryExitDialog from "@/components/inventory/StockEntryExitDialog";
import StockTransferDialog from "@/components/inventory/StockTransferDialog";
import { useInventoryTransactions } from "@/hooks/useInventoryTransactions";
import { InventoryTransaction } from "@/types/inventory";
import { toast } from "sonner";
import { ConfirmationDialogComponent } from "@/components/ui/confirmation-dialog";

interface InventoryTransactionsProps {
  isCollapsed?: boolean;
  setIsCollapsed?: (collapsed: boolean) => void;
}

const InventoryTransactions = ({ isCollapsed, setIsCollapsed }: InventoryTransactionsProps) => {
  const { t } = useTranslation();
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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<InventoryTransaction | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [transactionToCancel, setTransactionToCancel] = useState<InventoryTransaction | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

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
    deleteTransaction,
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

  const handleDelete = useCallback((transaction: InventoryTransaction) => {
    // Sayım işlemleri silinemez
    if (transaction.transaction_type === 'sayim') {
      toast.error("Sayım işlemleri silinemez. Lütfen yeni bir sayım işlemi oluşturun.");
      return;
    }

    setTransactionToDelete(transaction);
    setIsDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!transactionToDelete) return;

    setIsDeleting(true);
    try {
      await deleteTransaction(transactionToDelete.id);
      toast.success("İşlem başarıyla silindi");
      setIsDeleteDialogOpen(false);
      setTransactionToDelete(null);
      refetch();
    } catch (error: any) {
      toast.error(error.message || "İşlem silinirken hata oluştu");
    } finally {
      setIsDeleting(false);
    }
  }, [transactionToDelete, deleteTransaction, refetch]);

  const handleDeleteCancel = useCallback(() => {
    setIsDeleteDialogOpen(false);
    setTransactionToDelete(null);
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

  const handleCancel = useCallback((transaction: InventoryTransaction) => {
    setTransactionToCancel(transaction);
    setIsCancelDialogOpen(true);
  }, []);

  const handleCancelConfirm = useCallback(async () => {
    if (!transactionToCancel) return;

    setIsCancelling(true);
    try {
      await cancelTransaction(transactionToCancel.id);
      toast.success("İşlem iptal edildi");
      setIsCancelDialogOpen(false);
      setTransactionToCancel(null);
      refetch();
    } catch (error: any) {
      toast.error(error.message || "İşlem iptal edilirken hata oluştu");
    } finally {
      setIsCancelling(false);
    }
  }, [transactionToCancel, cancelTransaction, refetch]);

  const handleCancelCancel = useCallback(() => {
    setIsCancelDialogOpen(false);
    setTransactionToCancel(null);
  }, []);

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

      {/* Silme Onay Dialog */}
      <ConfirmationDialogComponent
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Stok Hareketini Sil"
        description={
          transactionToDelete
            ? transactionToDelete.status === 'completed'
              ? `"${transactionToDelete.transaction_number}" numaralı onaylanmış işlemi silmek istediğinizden emin misiniz? Stoklar geri alınacaktır. Bu işlem geri alınamaz.`
              : `"${transactionToDelete.transaction_number}" numaralı işlemi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`
            : "Bu işlemi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
        }
        confirmText={t("common.delete")}
        cancelText={t("common.cancel")}
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        isLoading={isDeleting}
      />

      {/* İptal Onay Dialog */}
      <ConfirmationDialogComponent
        open={isCancelDialogOpen}
        onOpenChange={setIsCancelDialogOpen}
        title="Stok Hareketini İptal Et"
        description={
          transactionToCancel
            ? `"${transactionToCancel.transaction_number}" numaralı işlemi iptal etmek istediğinizden emin misiniz?`
            : "Bu işlemi iptal etmek istediğinizden emin misiniz?"
        }
        confirmText={t("common.cancel")}
        cancelText={t("common.close")}
        variant="default"
        onConfirm={handleCancelConfirm}
        onCancel={handleCancelCancel}
        isLoading={isCancelling}
      />
    </div>
  );
};

export default memo(InventoryTransactions);
