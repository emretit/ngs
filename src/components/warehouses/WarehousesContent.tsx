import React from "react";
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
  onWarehouseDelete?: (warehouse: Warehouse) => void;
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
  onWarehouseDelete,
  selectedWarehouses = [],
  searchQuery,
  typeFilter,
  statusFilter
}: WarehousesContentProps) => {
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
            onWarehouseDelete={onWarehouseDelete}
            selectedWarehouses={selectedWarehouses}
          />
        )}
        
        {/* Tüm depolar yüklendi mesajı - sadece table view için değil, grid view için de */}
        {!hasNextPage && warehouses.length > 0 && !isLoading && (
          <div className="text-center py-4 text-sm text-gray-500">
            Tüm depolar yüklendi
          </div>
        )}
      </div>
    </div>
  );
};

export default WarehousesContent;

