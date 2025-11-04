import React, { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { Warehouse } from "@/types/warehouse";
import WarehousesTable from "./WarehousesTable";
import WarehousesGrid from "./WarehousesGrid";

interface WarehousesContentProps {
  warehouses: Warehouse[];
  isLoading: boolean;
  isLoadingMore?: boolean;
  hasNextPage?: boolean;
  loadMore?: () => void;
  totalCount?: number;
  error: any;
  activeView: "grid" | "table";
  sortField: "name" | "code" | "warehouse_type" | "is_active";
  sortDirection: "asc" | "desc";
  onSortFieldChange: (field: "name" | "code" | "warehouse_type" | "is_active") => void;
  onWarehouseClick: (warehouse: Warehouse) => void;
  onWarehouseSelect: (warehouse: Warehouse) => void;
  selectedWarehouses?: Warehouse[];
  searchQuery?: string;
  typeFilter?: string;
  statusFilter?: string;
}

const WarehousesContent = ({
  warehouses,
  isLoading,
  isLoadingMore = false,
  hasNextPage = false,
  loadMore,
  totalCount,
  error,
  activeView,
  sortField,
  sortDirection,
  onSortFieldChange,
  onWarehouseClick,
  onWarehouseSelect,
  selectedWarehouses = [],
  searchQuery,
  typeFilter,
  statusFilter
}: WarehousesContentProps) => {
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!loadMore || !hasNextPage || isLoadingMore || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [loadMore, hasNextPage, isLoadingMore, isLoading]);

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-red-500">Depolar yüklenirken bir hata oluştu.</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="pb-6">
        {activeView === "grid" ? (
          <WarehousesGrid
            warehouses={warehouses}
            isLoading={isLoading}
            isLoadingMore={isLoadingMore}
            hasNextPage={hasNextPage}
            loadMore={loadMore}
            onWarehouseClick={onWarehouseClick}
            onWarehouseSelect={onWarehouseSelect}
            selectedWarehouses={selectedWarehouses}
          />
        ) : (
          <WarehousesTable
            warehouses={warehouses}
            isLoading={isLoading}
            isLoadingMore={isLoadingMore}
            hasNextPage={hasNextPage}
            loadMore={loadMore}
            totalCount={totalCount || 0}
            sortField={sortField}
            sortDirection={sortDirection}
            onSortFieldChange={onSortFieldChange}
            onWarehouseClick={onWarehouseClick}
            onWarehouseSelect={onWarehouseSelect}
            selectedWarehouses={selectedWarehouses}
          />
        )}
        
        {/* Infinite scroll trigger */}
        {!isLoading && hasNextPage && (
          <div ref={loadMoreRef} className="flex justify-center py-4">
            {isLoadingMore && (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-gray-600">Daha fazla depo yükleniyor...</span>
              </div>
            )}
          </div>
        )}
        
        {/* Tüm depolar yüklendi mesajı */}
        {!hasNextPage && warehouses.length > 0 && (
          <div className="text-center py-4 text-sm text-gray-500">
            Tüm depolar yüklendi
          </div>
        )}
      </div>
    </div>
  );
};

export default WarehousesContent;

