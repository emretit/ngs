import { memo, useCallback } from "react";
import { Table, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { Warehouse } from "@/types/warehouse";
import WarehousesTableHeader from "./table/WarehousesTableHeader";
import WarehousesTableRow from "./table/WarehousesTableRow";
import WarehousesTableSkeleton from "./table/WarehousesTableSkeleton";
import InfiniteScroll from "@/components/ui/infinite-scroll";

interface WarehousesTableProps {
  warehouses: Warehouse[];
  isLoading: boolean;
  isLoadingMore?: boolean;
  hasNextPage?: boolean;
  loadMore?: () => void;
  totalCount?: number;
  sortField: "name" | "code" | "warehouse_type" | "is_active";
  sortDirection: "asc" | "desc";
  onSortFieldChange: (field: "name" | "code" | "warehouse_type" | "is_active") => void;
  onWarehouseClick?: (warehouse: Warehouse) => void;
  onWarehouseSelect?: (warehouse: Warehouse) => void;
  onWarehouseDelete?: (warehouse: Warehouse) => void;
  selectedWarehouses?: Warehouse[];
}

const WarehousesTable = ({
  warehouses,
  isLoading,
  isLoadingMore = false,
  hasNextPage = false,
  loadMore,
  totalCount = 0,
  sortField,
  sortDirection,
  onSortFieldChange,
  onWarehouseClick,
  onWarehouseSelect,
  onWarehouseDelete,
  selectedWarehouses = []
}: WarehousesTableProps) => {
  const handleWarehouseSelectToggle = useCallback((warehouse: Warehouse) => {
    const isSelected = selectedWarehouses.some(w => w.id === warehouse.id);
    if (isSelected) {
      onWarehouseSelect?.(warehouse);
    } else {
      onWarehouseSelect?.(warehouse);
    }
  }, [selectedWarehouses, onWarehouseSelect]);

  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      warehouses?.forEach(w => {
        if (!selectedWarehouses.some(sw => sw.id === w.id)) {
          onWarehouseSelect?.(w);
        }
      });
    } else {
      warehouses?.forEach(w => onWarehouseSelect?.(w));
    }
  }, [warehouses, selectedWarehouses, onWarehouseSelect]);

  if (isLoading && (!warehouses || warehouses.length === 0)) {
    return <WarehousesTableSkeleton />;
  }

  return (
    <div className="-mx-4">
      <div className="px-4">
        <Table>
        <WarehousesTableHeader 
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={onSortFieldChange}
          hasSelection={true}
          onSelectAll={handleSelectAll}
          isAllSelected={selectedWarehouses.length > 0 && selectedWarehouses.length === (warehouses?.length || 0)}
          totalWarehouses={totalCount}
        />
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                Yükleniyor...
              </TableCell>
            </TableRow>
          ) : warehouses?.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                Depo bulunamadı
              </TableCell>
            </TableRow>
          ) : (
            warehouses?.map((warehouse) => {
              const isSelected = selectedWarehouses.some(w => w.id === warehouse.id);
              return (
                <WarehousesTableRow
                  key={warehouse.id}
                  warehouse={warehouse}
                  onSelect={onWarehouseSelect}
                  onSelectToggle={handleWarehouseSelectToggle}
                  onView={onWarehouseClick}
                  onDelete={onWarehouseDelete}
                  isSelected={isSelected}
                />
              );
            })
          )}
        </TableBody>
        </Table>
      </div>

      {/* Infinite Scroll Trigger */}
      {hasNextPage && (
        <div className="px-4">
          <InfiniteScroll
            hasNextPage={hasNextPage}
            isLoadingMore={isLoadingMore}
            onLoadMore={loadMore}
            className="mt-4"
          >
            <div />
          </InfiniteScroll>
        </div>
      )}
    </div>
  );
};

export default memo(WarehousesTable);

