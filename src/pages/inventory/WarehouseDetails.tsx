import { useState, useCallback, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Warehouse } from "@/types/warehouse";
import { InventoryTransaction } from "@/types/inventory";
import { showSuccess, showError } from "@/utils/toastUtils";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Warehouse as WarehouseIcon, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import InventoryTransactionsContent from "@/components/inventory/InventoryTransactionsContent";
import InventoryTransactionsFilterBar from "@/components/inventory/InventoryTransactionsFilterBar";
import InventoryTransactionsBulkActions from "@/components/inventory/InventoryTransactionsBulkActions";
import InventoryTransactionsViewToggle from "@/components/inventory/InventoryTransactionsViewToggle";
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

  // Fetch warehouse transactions with filters
  const { data: transactions = [], isLoading: isLoadingTransactions } = useQuery({
    queryKey: ["warehouse_transactions", id, debouncedSearchQuery, typeFilter, statusFilter, startDate, endDate, sortField, sortDirection],
    queryFn: async () => {
      // Get current user's company_id
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user?.id)
        .single();

      // TODO: inventory_transactions tablosu oluşturulduğunda bu sorguyu güncelle
      // Şimdilik boş array döndürüyoruz
      return [];
      
      // let query = supabase
      //   .from("inventory_transactions")
      //   .select(`
      //     *,
      //     items:inventory_transaction_items(*)
      //   `)
      //   .eq("company_id", profile?.company_id)
      //   .or(`warehouse_id.eq.${id},from_warehouse_id.eq.${id},to_warehouse_id.eq.${id}`);

      // // Search filter
      // if (debouncedSearchQuery) {
      //   query = query.or(`transaction_number.ilike.%${debouncedSearchQuery}%,reference_number.ilike.%${debouncedSearchQuery}%,notes.ilike.%${debouncedSearchQuery}%`);
      // }

      // // Type filter
      // if (typeFilter && typeFilter !== "all") {
      //   query = query.eq("transaction_type", typeFilter);
      // }

      // // Status filter
      // if (statusFilter && statusFilter !== "all") {
      //   query = query.eq("status", statusFilter);
      // }

      // // Date range filter
      // if (startDate) {
      //   query = query.gte("transaction_date", startDate.toISOString().split("T")[0]);
      // }
      // if (endDate) {
      //   query = query.lte("transaction_date", endDate.toISOString().split("T")[0]);
      // }

      // // Sort
      // query = query.order(sortField, { ascending: sortDirection === "asc" });

      // const { data, error } = await query;
      // if (error) throw error;
      // return (data as unknown as InventoryTransaction[]) || [];
    },
    enabled: !!id
  });

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

  const handleCreateTransaction = useCallback((type: string) => {
    navigate(`/inventory/transactions/${type}/new?warehouse_id=${id}`);
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

  const getTypeLabel = (type?: string) => {
    switch (type) {
      case 'main':
        return 'Ana Depo';
      case 'sub':
        return 'Alt Depo';
      case 'virtual':
        return 'Sanal Depo';
      case 'transit':
        return 'Geçici Depo';
      default:
        return 'Depo';
    }
  };

  const getTypeColor = (type?: string) => {
    switch (type) {
      case 'main':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'sub':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'virtual':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'transit':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between p-3 pl-12 bg-white rounded-md border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/inventory/warehouses')}
            className="h-8 w-8 p-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="p-2 bg-gradient-to-r from-green-500 to-green-600 rounded-lg text-white shadow-lg">
            <WarehouseIcon className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">{warehouse.name}</h1>
            <p className="text-xs text-muted-foreground/70">
              Depo bilgileri ve işlem geçmişi
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate(`/inventory/warehouses/${id}/edit`)}
        >
          <Edit className="h-4 w-4 mr-2" />
          Düzenle
        </Button>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Durum</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge 
              variant="outline" 
              className={warehouse.is_active 
                ? "bg-green-100 text-green-800 border-green-300" 
                : "bg-gray-100 text-gray-800 border-gray-300"
              }
            >
              {warehouse.is_active ? "Aktif" : "Pasif"}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Depo Tipi</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="outline" className={getTypeColor(warehouse.warehouse_type)}>
              {getTypeLabel(warehouse.warehouse_type)}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Toplam İşlem</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transactionStats.total}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {transactionStats.completed} tamamlandı
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="info" className="space-y-4">
        <TabsList>
          <TabsTrigger value="info">Bilgiler</TabsTrigger>
          <TabsTrigger value="transactions">İşlemler ({transactions.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Genel Bilgiler</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Depo Adı</label>
                  <p className="text-sm font-medium">{warehouse.name}</p>
                </div>
                {warehouse.code && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Kod</label>
                    <p className="text-sm font-medium">{warehouse.code}</p>
                  </div>
                )}
                {warehouse.address && (
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-muted-foreground">Adres</label>
                    <p className="text-sm">{warehouse.address}</p>
                  </div>
                )}
                {warehouse.city && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Şehir</label>
                    <p className="text-sm">{warehouse.city}{warehouse.district ? `, ${warehouse.district}` : ''}</p>
                  </div>
                )}
                {warehouse.phone && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Telefon</label>
                    <p className="text-sm">{warehouse.phone}</p>
                  </div>
                )}
                {warehouse.email && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">E-posta</label>
                    <p className="text-sm">{warehouse.email}</p>
                  </div>
                )}
                {warehouse.manager_name && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Sorumlu</label>
                    <p className="text-sm">{warehouse.manager_name}</p>
                    {warehouse.manager_phone && (
                      <p className="text-xs text-muted-foreground">{warehouse.manager_phone}</p>
                    )}
                  </div>
                )}
                {warehouse.capacity && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Kapasite</label>
                    <p className="text-sm">{warehouse.capacity} {warehouse.capacity_unit || 'birim'}</p>
                  </div>
                )}
              </div>
              {warehouse.notes && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Notlar</label>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{warehouse.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          {/* İşlemler Header */}
          <div className="flex items-center justify-between p-3 bg-white rounded-md border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold">Depo İşlemleri</h2>
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
              <Button
                onClick={() => handleCreateTransaction('giris')}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                <span>Yeni İşlem</span>
              </Button>
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
                <Button
                  variant="outline"
                  onClick={() => handleCreateTransaction('giris')}
                  className="flex items-center gap-2 mx-auto"
                >
                  <Plus className="h-4 w-4" />
                  <span>Yeni İşlem Oluştur</span>
                </Button>
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
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WarehouseDetails;

