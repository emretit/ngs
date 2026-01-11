import { useState, useCallback, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Warehouse } from "@/types/warehouse";
import { InventoryTransaction } from "@/types/inventory";
import { showSuccess, showError } from "@/utils/toastUtils";
import { Button } from "@/components/ui/button";
import { Plus, ChevronDown, ArrowDownToLine, ArrowUpFromLine, ArrowRightLeft, ClipboardList } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import WarehouseDetailsHeader from "@/components/warehouses/details/WarehouseDetailsHeader";
import { WarehouseInfo } from "@/components/warehouses/details/WarehouseInfo";
import InventoryTransactionsContent from "@/components/inventory/InventoryTransactionsContent";
import InventoryTransactionsFilterBar from "@/components/inventory/InventoryTransactionsFilterBar";
import InventoryTransactionsBulkActions from "@/components/inventory/InventoryTransactionsBulkActions";
import InventoryTransactionsViewToggle from "@/components/inventory/InventoryTransactionsViewToggle";
import StockEntryExitDialog from "@/components/inventory/StockEntryExitDialog";
import StockTransferDialog from "@/components/inventory/StockTransferDialog";
import { useInventoryTransactions } from "@/hooks/useInventoryTransactions";
import { toast } from "sonner";

const WarehouseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // İşlemler için state'ler
  const [activeView, setActiveView] = useState<"grid" | "table">("table");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
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
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch warehouse
  const { data: warehouse, isLoading } = useQuery({
    queryKey: ["warehouse", id],
    queryFn: async () => {
      // Get current user's company_id
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user?.id)
        .single();

      const { data: warehouseData, error } = await supabase
        .from("warehouses")
        .select("*")
        .eq("id", id)
        .eq("company_id", profile?.company_id)
        .single();
      
      if (error) throw error;
      return warehouseData as Warehouse;
    },
    meta: {
      onError: (error: Error) => {
        console.error("Error fetching warehouse:", error);
        showError("Depo bilgilerini alırken bir hata oluştu");
      }
    },
    enabled: !!id
  });

  // useInventoryTransactions hook'unu kullan
  const { 
    transactions, 
    isLoading: isLoadingTransactions,
    filters,
    setFilters,
  } = useInventoryTransactions();

  // Depo ID'sine göre filtreleri güncelle
  useEffect(() => {
    if (id) {
      setFilters(prev => ({
        ...prev,
        warehouse_id: id,
        transaction_type: typeFilter as typeof prev.transaction_type,
        status: statusFilter as typeof prev.status,
        search: debouncedSearchQuery,
        dateRange: {
          from: startDate || null,
          to: endDate || null,
        },
      }));
    }
  }, [id, typeFilter, statusFilter, debouncedSearchQuery, startDate, endDate, setFilters]);

  // İşlem istatistikleri hesapla
  const transactionStats = {
    total: transactions.length,
    pending: transactions.filter(t => t.status === 'pending').length,
    approved: transactions.filter(t => t.status === 'approved').length,
    completed: transactions.filter(t => t.status === 'completed').length,
    cancelled: transactions.filter(t => t.status === 'cancelled').length,
    by_type: {
      giris: transactions.filter(t => t.transaction_type === 'giris').length,
      cikis: transactions.filter(t => t.transaction_type === 'cikis').length,
      transfer: transactions.filter(t => t.transaction_type === 'transfer').length,
      sayim: transactions.filter(t => t.transaction_type === 'sayim').length,
    }
  };

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
      toast.info("Export işlemi yakında eklenecek");
    } else if (action === 'approve') {
      toast.info("Toplu onaylama yakında eklenecek");
    } else if (action === 'cancel') {
      toast.info("Toplu iptal yakında eklenecek");
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
      navigate(`/inventory/transactions/${type}/new?warehouse_id=${id}`);
    }
  }, [navigate, id]);

  const updateWarehouseMutation = useMutation({
    mutationFn: async (updates: Partial<Warehouse>) => {
      const { error } = await supabase
        .from("warehouses")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouse", id] });
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
      showSuccess("Depo başarıyla güncellendi", { duration: 1000 });
    },
    onError: (error) => {
      console.error("Error updating warehouse:", error);
      showError("Depo güncellenirken bir hata oluştu");
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!warehouse) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Depo bulunamadı</h2>
        <p className="text-gray-600">Bu depo mevcut değil veya silinmiş olabilir.</p>
      </div>
    );
  }

  const handleEdit = () => {
    navigate(`/inventory/warehouses/${id}/edit`);
  };

  const handleWarehouseUpdate = (updatedWarehouse: Warehouse) => {
    // Update handled by query invalidation
  };

  return (
    <>
      <WarehouseDetailsHeader
        warehouse={warehouse}
        id={id || ''}
        onEdit={handleEdit}
        onUpdate={handleWarehouseUpdate}
      />
      <div className="space-y-4 mt-4">
        <WarehouseInfo
          warehouse={warehouse}
          onUpdate={handleWarehouseUpdate}
        />
        
        {/* İşlemler Section */}
        <div className="space-y-4">
          {/* İşlemler Header */}
          <div className="flex items-center justify-between p-3 bg-white rounded-md border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold">Stok Hareketleri</h2>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  Toplam: {transactionStats.total}
                </Badge>
                <Badge variant="outline" className="text-xs border-green-500 text-green-700">
                  Tamamlanan: {transactionStats.completed}
                </Badge>
                <Badge variant="outline" className="text-xs border-orange-500 text-orange-700">
                  Bekleyen: {transactionStats.pending}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <InventoryTransactionsViewToggle 
                activeView={activeView} 
                setActiveView={setActiveView} 
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    <span>Yeni İşlem</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    onClick={() => handleCreateTransaction('giris')}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <ArrowDownToLine className="h-4 w-4 text-green-600" />
                    <span>Stok Girişi</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleCreateTransaction('cikis')}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <ArrowUpFromLine className="h-4 w-4 text-red-600" />
                    <span>Stok Çıkışı</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleCreateTransaction('transfer')}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <ArrowRightLeft className="h-4 w-4 text-blue-600" />
                    <span>Depo Transferi</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleCreateTransaction('sayim')}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <ClipboardList className="h-4 w-4 text-purple-600" />
                    <span>Stok Sayımı</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Filters */}
          <InventoryTransactionsFilterBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedType={typeFilter}
            setSelectedType={setTypeFilter}
            selectedStatus={statusFilter}
            setSelectedStatus={setStatusFilter}
            selectedWarehouse="all"
            setSelectedWarehouse={() => {}}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
            hideWarehouseFilter={true}
          />

          {/* Bulk Actions */}
          {selectedTransactions.length > 0 && (
            <InventoryTransactionsBulkActions 
              selectedTransactions={selectedTransactions}
              onClearSelection={handleClearSelection}
              onBulkAction={handleBulkAction}
            />
          )}

          {/* Content */}
          {isLoadingTransactions ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center space-y-4">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-muted-foreground">İşlemler yükleniyor...</p>
              </div>
            </div>
          ) : transactions.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12 text-muted-foreground">
                <p className="mb-4">Bu depoya ait henüz işlem kaydı bulunmuyor</p>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex items-center gap-2 mx-auto"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Yeni İşlem Oluştur</span>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center" className="w-48">
                    <DropdownMenuItem
                      onClick={() => handleCreateTransaction('giris')}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <ArrowDownToLine className="h-4 w-4 text-green-600" />
                      <span>Stok Girişi</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleCreateTransaction('cikis')}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <ArrowUpFromLine className="h-4 w-4 text-red-600" />
                      <span>Stok Çıkışı</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleCreateTransaction('transfer')}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <ArrowRightLeft className="h-4 w-4 text-blue-600" />
                      <span>Depo Transferi</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleCreateTransaction('sayim')}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <ClipboardList className="h-4 w-4 text-purple-600" />
                      <span>Stok Sayımı</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardContent>
            </Card>
          ) : (
            <InventoryTransactionsContent
              transactions={transactions}
              isLoading={isLoadingTransactions}
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
      </div>

      {/* Stok Giriş/Çıkış Dialog */}
      <StockEntryExitDialog
        isOpen={isStockDialogOpen}
        onClose={() => setIsStockDialogOpen(false)}
        transactionType={stockDialogType}
        warehouseId={id}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["inventory_transactions"] });
        }}
      />

      {/* Depo Transferi Dialog */}
      <StockTransferDialog
        isOpen={isTransferDialogOpen}
        onClose={() => setIsTransferDialogOpen(false)}
        fromWarehouseId={id}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["inventory_transactions"] });
        }}
      />
    </>
  );
};

export default WarehouseDetails;

