import React, { useEffect, useRef } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Supplier } from "@/types/supplier";
import SuppliersTable from "./SuppliersTable";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

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
  typeFilter
}: SuppliersContentProps) => {
  const { toast } = useToast();
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!loadMore || !hasNextPage || isLoadingMore) return;

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
  }, [loadMore, hasNextPage, isLoadingMore]);

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-red-500">Tedarikçiler yüklenirken bir hata oluştu.</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="p-6 bg-white rounded-xl relative overflow-hidden">
        <div className="relative z-10">
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
          />
          
          {/* Infinite scroll trigger */}
          {hasNextPage && (
            <div ref={loadMoreRef} className="flex justify-center py-4">
              {isLoadingMore ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-gray-600">Daha fazla tedarikçi yükleniyor...</span>
                </div>
              ) : (
                <Button
                  variant="outline"
                  onClick={loadMore}
                  className="text-sm"
                >
                  Daha Fazla Yükle
                </Button>
              )}
            </div>
          )}
          
          {/* Tüm tedarikçiler yüklendi mesajı */}
          {!hasNextPage && suppliers.length > 0 && (
            <div className="text-center py-4 text-sm text-gray-500">
              Tüm tedarikçiler yüklendi
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SuppliersContent;
