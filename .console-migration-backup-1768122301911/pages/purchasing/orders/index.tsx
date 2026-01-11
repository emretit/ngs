import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { usePurchaseOrdersInfiniteScroll, PurchaseOrder } from "@/hooks/usePurchaseOrders";
import { useDebounce } from "@/hooks/useDebounce";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import PurchaseOrdersHeader from "@/components/purchase/orders/PurchaseOrdersHeader";
import PurchaseOrdersFilterBar from "@/components/purchase/orders/PurchaseOrdersFilterBar";
import PurchaseOrdersContent from "@/components/purchase/orders/PurchaseOrdersContent";

const PurchaseOrdersList = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedSupplier, setSelectedSupplier] = useState<string>("all");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const pageSize = 20;
  
  // Sıralama state'leri - veritabanı seviyesinde sıralama için
  const [sortField, setSortField] = useState<string>("created_at");
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = useCallback((field: string) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }, [sortField, sortDirection]);

  // Debounced search - 300ms gecikme ile optimize edildi
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Fetch suppliers data
  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("suppliers")
        .select("id, name")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      return data;
    },
  });

  // Use infinite scroll hook - debounced search kullanılıyor
  const {
    data: orders,
    isLoading,
    isLoadingMore,
    hasNextPage,
    error,
    loadMore,
    refresh,
    totalCount,
  } = usePurchaseOrdersInfiniteScroll(
    {
      status: selectedStatus !== "all" ? selectedStatus : undefined,
      search: debouncedSearchQuery, // Debounced search kullanılıyor
      supplier_id: selectedSupplier !== "all" ? selectedSupplier : undefined,
      dateRange: { from: startDate || null, to: endDate || null },
      sortField,
      sortDirection
    },
    pageSize
  );

  if (error) {
    toast.error("Siparişler yüklenirken bir hata oluştu");
    console.error("Error loading orders:", error);
  }

  // Order tıklama handler'ı - useCallback ile optimize edildi
  const handleOrderClick = useCallback(
    (order: any) => {
      navigate(`/purchasing/orders/${order.id}`);
    },
    [navigate]
  );

  return (
    <>
      <div className="space-y-2">
        {/* Header */}
        <PurchaseOrdersHeader orders={(orders as PurchaseOrder[]) || []} />

        {/* Filters */}
        <PurchaseOrdersFilterBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedStatus={selectedStatus}
          setSelectedStatus={setSelectedStatus}
          selectedSupplier={selectedSupplier}
          setSelectedSupplier={setSelectedSupplier}
          suppliers={suppliers}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
        />

        {isLoading && orders?.length === 0 ? (
          <div className="flex items-center justify-center h-[400px]">
            <div className="text-center space-y-4">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-muted-foreground">Siparişler yükleniyor...</p>
            </div>
          </div>
        ) : error ? (
          <div className="h-96 flex items-center justify-center">
            <div className="text-red-500">
              Siparişler yüklenirken bir hata oluştu
            </div>
          </div>
        ) : (
          <PurchaseOrdersContent
            orders={(orders as PurchaseOrder[]) || []}
            isLoading={isLoading}
            isLoadingMore={isLoadingMore}
            hasNextPage={hasNextPage}
            loadMore={loadMore}
            totalCount={totalCount}
            error={error}
            onOrderSelect={handleOrderClick}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
          />
        )}
      </div>
    </>
  );
};

export default React.memo(PurchaseOrdersList);
