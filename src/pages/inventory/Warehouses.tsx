import { useState, useCallback, useEffect, memo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import WarehousesHeader from "@/components/warehouses/WarehousesHeader";
import WarehousesFilterBar from "@/components/warehouses/WarehousesFilterBar";
import WarehousesContent from "@/components/warehouses/WarehousesContent";
import WarehousesBulkActions from "@/components/warehouses/WarehousesBulkActions";
import { supabase } from "@/integrations/supabase/client";
import { Warehouse } from "@/types/warehouse";
import { toast } from "sonner";

const Warehouses = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeView, setActiveView] = useState<"grid" | "table">("table");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Debounced search query
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [sortField, setSortField] = useState<"name" | "code" | "warehouse_type" | "is_active">("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedWarehouses, setSelectedWarehouses] = useState<Warehouse[]>([]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Real-time subscription - warehouses tablosundaki değişiklikleri dinle
  useEffect(() => {
    const setupRealtimeSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile?.company_id) return;

      // Subscribe to warehouses table changes
      const channel = supabase
        .channel('warehouses_changes')
        .on(
          'postgres_changes',
          {
            event: '*', // INSERT, UPDATE, DELETE
            schema: 'public',
            table: 'warehouses',
            filter: `company_id=eq.${profile.company_id}`
          },
          (payload) => {
            console.log('🔄 Warehouse changed:', payload.eventType, payload.new || payload.old);
            // Invalidate queries to refetch data
            queryClient.invalidateQueries({ queryKey: ['warehouses'] });
            queryClient.invalidateQueries({ queryKey: ['warehouse'] });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    const cleanup = setupRealtimeSubscription();

    return () => {
      cleanup.then(cleanupFn => cleanupFn?.());
    };
  }, [queryClient]);

  // Fetch warehouses
  const { 
    data: warehouses, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ["warehouses", debouncedSearchQuery, typeFilter, statusFilter, sortField, sortDirection],
    queryFn: async () => {
      // Get current user's company_id
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user?.id)
        .single();

      let query = supabase
        .from("warehouses")
        .select("*", { count: 'exact' })
        .eq("company_id", profile?.company_id);

      // Apply search filter
      if (debouncedSearchQuery) {
        query = query.or(`name.ilike.%${debouncedSearchQuery}%,code.ilike.%${debouncedSearchQuery}%,address.ilike.%${debouncedSearchQuery}%`);
      }

      // Apply type filter
      if (typeFilter && typeFilter !== "all") {
        query = query.eq("warehouse_type", typeFilter);
      }

      // Apply status filter
      if (statusFilter && statusFilter !== "all") {
        query = query.eq("is_active", statusFilter === "active");
      }

      // Apply sorting
      query = query.order(sortField, { ascending: sortDirection === "asc" });

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: (data as Warehouse[]) || [],
        totalCount: count || 0,
      };
    },
    enabled: !!debouncedSearchQuery !== undefined,
    refetchOnMount: true, // Mount olduğunda yeniden yükleme
  });

  if (error) {
    toast.error("Depolar yüklenirken bir hata oluştu");
    console.error("Error loading warehouses:", error);
  }

  const handleSort = useCallback((field: "name" | "code" | "warehouse_type" | "is_active") => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection(field === "is_active" ? "desc" : "asc");
    }
  }, [sortField, sortDirection]);

  const handleWarehouseClick = useCallback((warehouse: Warehouse) => {
    navigate(`/inventory/warehouses/${warehouse.id}`);
  }, [navigate]);

  const handleWarehouseSelect = useCallback((warehouse: Warehouse) => {
    setSelectedWarehouses(prev => {
      const isSelected = prev.some(w => w.id === warehouse.id);
      return isSelected
        ? prev.filter(w => w.id !== warehouse.id)
        : [...prev, warehouse];
    });
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedWarehouses([]);
  }, []);

  const handleDeleteWarehouse = useCallback(async (warehouse: Warehouse) => {
    if (!confirm(`"${warehouse.name}" deposunu silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`)) {
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user?.id)
        .single();

      if (!profile?.company_id) {
        toast.error("Şirket bilgisi bulunamadı");
        return;
      }

      // Önce depoda stok var mı kontrol et
      const { data: stockData, error: stockError } = await supabase
        .from("warehouse_stock")
        .select("id")
        .eq("warehouse_id", warehouse.id)
        .eq("company_id", profile.company_id)
        .limit(1);

      if (stockError) {
        console.error("Stok kontrolü hatası:", stockError);
      }

      if (stockData && stockData.length > 0) {
        toast.error("Bu depoda stok bulunmaktadır. Önce stokları temizlemeniz gerekmektedir.");
        return;
      }

      // Depo ile ilişkili transaction var mı kontrol et
      const { data: transactionData, error: transactionError } = await supabase
        .from("inventory_transactions")
        .select("id")
        .or(`warehouse_id.eq.${warehouse.id},from_warehouse_id.eq.${warehouse.id},to_warehouse_id.eq.${warehouse.id}`)
        .eq("company_id", profile.company_id)
        .limit(1);

      if (transactionError) {
        console.error("Transaction kontrolü hatası:", transactionError);
      }

      if (transactionData && transactionData.length > 0) {
        toast.error("Bu depo ile ilişkili stok hareketleri bulunmaktadır. Depo silinemez.");
        return;
      }

      // Depoyu sil
      const { error } = await supabase
        .from("warehouses")
        .delete()
        .eq("id", warehouse.id)
        .eq("company_id", profile.company_id);

      if (error) {
        console.error("Depo silme hatası:", error);
        toast.error("Depo silinirken bir hata oluştu");
        return;
      }

      toast.success(`"${warehouse.name}" deposu başarıyla silindi`);
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
      queryClient.invalidateQueries({ queryKey: ["warehouse_statistics"] });
      
      // Seçili listeden de çıkar
      setSelectedWarehouses(prev => prev.filter(w => w.id !== warehouse.id));
    } catch (error) {
      console.error("Depo silme hatası:", error);
      toast.error("Depo silinirken bir hata oluştu");
    }
  }, [queryClient]);

  const handleBulkDelete = useCallback(async () => {
    if (selectedWarehouses.length === 0) return;

    const warehouseNames = selectedWarehouses.map(w => w.name).join(", ");
    if (!confirm(`${selectedWarehouses.length} depoyu silmek istediğinize emin misiniz?\n\nSilinecek depolar: ${warehouseNames}\n\nBu işlem geri alınamaz.`)) {
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user?.id)
        .single();

      if (!profile?.company_id) {
        toast.error("Şirket bilgisi bulunamadı");
        return;
      }

      const warehouseIds = selectedWarehouses.map(w => w.id);
      let deletedCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (const warehouse of selectedWarehouses) {
        try {
          // Stok kontrolü
          const { data: stockData } = await supabase
            .from("warehouse_stock")
            .select("id")
            .eq("warehouse_id", warehouse.id)
            .eq("company_id", profile.company_id)
            .limit(1);

          if (stockData && stockData.length > 0) {
            errors.push(`${warehouse.name}: Depoda stok bulunmaktadır`);
            errorCount++;
            continue;
          }

          // Transaction kontrolü
          const { data: transactionData } = await supabase
            .from("inventory_transactions")
            .select("id")
            .or(`warehouse_id.eq.${warehouse.id},from_warehouse_id.eq.${warehouse.id},to_warehouse_id.eq.${warehouse.id}`)
            .eq("company_id", profile.company_id)
            .limit(1);

          if (transactionData && transactionData.length > 0) {
            errors.push(`${warehouse.name}: Depo ile ilişkili stok hareketleri bulunmaktadır`);
            errorCount++;
            continue;
          }

          // Depoyu sil
          const { error } = await supabase
            .from("warehouses")
            .delete()
            .eq("id", warehouse.id)
            .eq("company_id", profile.company_id);

          if (error) {
            errors.push(`${warehouse.name}: ${error.message}`);
            errorCount++;
          } else {
            deletedCount++;
          }
        } catch (error: any) {
          errors.push(`${warehouse.name}: ${error.message || "Bilinmeyen hata"}`);
          errorCount++;
        }
      }

      if (deletedCount > 0) {
        toast.success(`${deletedCount} depo başarıyla silindi`);
        queryClient.invalidateQueries({ queryKey: ["warehouses"] });
        queryClient.invalidateQueries({ queryKey: ["warehouse_statistics"] });
        setSelectedWarehouses([]);
      }

      if (errorCount > 0) {
        toast.error(`${errorCount} depo silinemedi. Detaylar: ${errors.join("; ")}`);
      }
    } catch (error) {
      console.error("Toplu silme hatası:", error);
      toast.error("Depolar silinirken bir hata oluştu");
    }
  }, [selectedWarehouses, queryClient]);

  const handleBulkAction = useCallback(async (action: string) => {
    if (action === 'export') {
      // TODO: Export functionality
      toast.info("Export işlemi yakında eklenecek");
    } else if (action === 'activate') {
      // TODO: Bulk activate
      toast.info("Toplu aktifleştirme yakında eklenecek");
    } else if (action === 'deactivate') {
      // TODO: Bulk deactivate
      toast.info("Toplu pasifleştirme yakında eklenecek");
    } else if (action === 'delete') {
      await handleBulkDelete();
    } else {
      console.log('Bulk action:', action, selectedWarehouses);
    }
  }, [selectedWarehouses, handleBulkDelete]);

  const handleCreateWarehouse = useCallback(() => {
    navigate('/inventory/warehouses/new');
  }, [navigate]);

  // Tüm depolar için istatistikleri çek (filtre olmadan, sadece company_id'ye göre)
  const { data: warehouseStatistics } = useQuery({
    queryKey: ["warehouse_statistics"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user?.id)
        .single();

      const companyId = profile?.company_id;
      if (!companyId) {
        return {
          total: 0,
          active: 0,
          inactive: 0,
          by_type: {
            main: 0,
            sub: 0,
            virtual: 0,
            transit: 0,
          }
        };
      }

      // Tüm depoları çek (filtre olmadan)
      const { data: allWarehouses, error: warehousesError } = await supabase
        .from("warehouses")
        .select("is_active, warehouse_type")
        .eq("company_id", companyId);

      if (warehousesError) throw warehousesError;
      if (!allWarehouses || allWarehouses.length === 0) {
        return {
          total: 0,
          active: 0,
          inactive: 0,
          by_type: {
            main: 0,
            sub: 0,
            virtual: 0,
            transit: 0,
          }
        };
      }

      return {
        total: allWarehouses.length,
        active: allWarehouses.filter(w => w.is_active).length,
        inactive: allWarehouses.filter(w => !w.is_active).length,
        by_type: {
          main: allWarehouses.filter(w => w.warehouse_type === 'main').length,
          sub: allWarehouses.filter(w => w.warehouse_type === 'sub').length,
          virtual: allWarehouses.filter(w => w.warehouse_type === 'virtual').length,
          transit: allWarehouses.filter(w => w.warehouse_type === 'transit').length,
        }
      };
    },
    staleTime: 5 * 60 * 1000, // 5 dakika
  });

  // Calculate stats - statistics varsa onu kullan, yoksa filtrelenmiş verilerden hesapla (fallback)
  const stats = warehouseStatistics || {
    total: warehouses?.data?.length || 0,
    active: warehouses?.data?.filter(w => w.is_active).length || 0,
    inactive: warehouses?.data?.filter(w => !w.is_active).length || 0,
    by_type: {
      main: warehouses?.data?.filter(w => w.warehouse_type === 'main').length || 0,
      sub: warehouses?.data?.filter(w => w.warehouse_type === 'sub').length || 0,
      virtual: warehouses?.data?.filter(w => w.warehouse_type === 'virtual').length || 0,
      transit: warehouses?.data?.filter(w => w.warehouse_type === 'transit').length || 0,
    }
  };

  return (
    <div className="space-y-2">
      {/* Header */}
      <WarehousesHeader 
        warehouses={warehouses?.data || []}
        stats={stats}
        activeView={activeView}
        setActiveView={setActiveView}
        onCreateWarehouse={handleCreateWarehouse}
      />
      
      {/* Filters */}
      <WarehousesFilterBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />
      
      {/* Bulk Actions */}
      <WarehousesBulkActions 
        selectedWarehouses={selectedWarehouses}
        onClearSelection={handleClearSelection}
        onBulkAction={handleBulkAction}
      />
      
      {isLoading ? (
        <div className="flex items-center justify-center h-[400px]">
          <div className="text-center space-y-4">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-muted-foreground">Depolar yükleniyor...</p>
          </div>
        </div>
      ) : error ? (
        <div className="h-96 flex items-center justify-center">
          <div className="text-red-500">Depolar yüklenirken bir hata oluştu</div>
        </div>
      ) : (
        <WarehousesContent
          warehouses={warehouses?.data || []}
          isLoading={isLoading}
          error={error}
          activeView={activeView}
          sortField={sortField}
          sortDirection={sortDirection}
          onSortFieldChange={handleSort}
          onWarehouseClick={handleWarehouseClick}
          onWarehouseSelect={handleWarehouseSelect}
          onWarehouseDelete={handleDeleteWarehouse}
          selectedWarehouses={selectedWarehouses}
          searchQuery={searchQuery}
          typeFilter={typeFilter}
          statusFilter={statusFilter}
          totalCount={warehouses?.totalCount || 0}
        />
      )}
    </div>
  );
};

export default memo(Warehouses);

