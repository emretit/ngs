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
    } else {
      console.log('Bulk action:', action, selectedWarehouses);
    }
  }, [selectedWarehouses]);

  const handleCreateWarehouse = useCallback(() => {
    navigate('/inventory/warehouses/new');
  }, [navigate]);

  // Calculate stats
  const stats = {
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
          activeView={activeView}
          sortField={sortField}
          sortDirection={sortDirection}
          onSortFieldChange={handleSort}
          onWarehouseClick={handleWarehouseClick}
          onWarehouseSelect={handleWarehouseSelect}
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

