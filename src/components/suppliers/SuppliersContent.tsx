import React from "react";
import { useToast } from "@/components/ui/use-toast";
import { Supplier } from "@/types/supplier";
import SuppliersTable from "./SuppliersTable";
import InfiniteScroll from "@/components/ui/infinite-scroll";

interface SuppliersContentProps {
  suppliers: Supplier[];
  isLoading: boolean;
  isLoadingMore?: boolean;
  hasNextPage?: boolean;
  loadMore?: () => void;
  totalCount?: number;
  error: any;
  onSupplierSelect: (supplier: Supplier) => void;
  onSupplierSelectToggle?: (supplier: Supplier) => void;
  selectedSuppliers?: Supplier[];
  setSelectedSuppliers?: (suppliers: Supplier[]) => void;
  searchQuery?: string;
  statusFilter?: string;
  typeFilter?: string;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (field: string) => void;
}

const SuppliersContent = ({
  suppliers,
  isLoading,
  isLoadingMore = false,
  hasNextPage = false,
  loadMore,
  totalCount,
  error,
  onSupplierSelect,
  onSupplierSelectToggle,
  selectedSuppliers = [],
  setSelectedSuppliers,
  searchQuery,
  statusFilter,
  typeFilter,
  sortField,
  sortDirection,
  onSort
}: SuppliersContentProps) => {
  const { toast } = useToast();

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-red-500">Tedarikçiler yüklenirken bir hata oluştu.</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="pb-6">
        <SuppliersTable
            suppliers={suppliers}
            isLoading={isLoading}
            totalCount={totalCount || 0}
            error={error}
            onSupplierSelect={onSupplierSelect}
            onSupplierSelectToggle={onSupplierSelectToggle}
            selectedSuppliers={selectedSuppliers}
            setSelectedSuppliers={setSelectedSuppliers}
            searchQuery={searchQuery}
            statusFilter={statusFilter}
            typeFilter={typeFilter}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={onSort}
          />
          
          {/* Infinite scroll trigger - SuppliersTable InfiniteScroll kullanmıyor, bu yüzden burada gösteriyoruz */}
          {!isLoading && hasNextPage && (
            <div className="px-4">
              <InfiniteScroll
                hasNextPage={hasNextPage}
                isLoadingMore={isLoadingMore}
                onLoadMore={loadMore || (() => {})}
                className="mt-4"
              >
                <div />
              </InfiniteScroll>
            </div>
          )}
          
          {/* Tüm tedarikçiler yüklendi mesajı */}
          {!hasNextPage && suppliers.length > 0 && !isLoading && (
            <div className="text-center py-4 text-sm text-gray-500">
              Tüm tedarikçiler yüklendi
            </div>
          )}
      </div>
    </div>
  );
};

export default SuppliersContent;
