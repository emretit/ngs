import React, { useEffect, useRef } from "react";
import DeliveriesTable from "./DeliveriesTable";
import { Delivery } from "@/types/deliveries";

interface DeliveriesContentProps {
  deliveries: Delivery[];
  isLoading: boolean;
  error: any;
  onSelectDelivery: (delivery: Delivery) => void;
  searchQuery?: string;
  statusFilter?: string;
  isLoadingMore?: boolean;
  hasNextPage?: boolean;
  loadMore?: () => void;
}

const DeliveriesContent = ({
  deliveries,
  isLoading,
  error,
  onSelectDelivery,
  searchQuery,
  statusFilter,
  isLoadingMore = false,
  hasNextPage = false,
  loadMore
}: DeliveriesContentProps) => {
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loadMore || !hasNextPage || isLoadingMore || isLoading) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        loadMore();
      }
    }, { threshold: 0.1 });
    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [loadMore, hasNextPage, isLoadingMore, isLoading]);
  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-red-500">Teslimatlar yüklenirken bir hata oluştu.</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="pb-6">
        <DeliveriesTable
          deliveries={deliveries}
          isLoading={isLoading}
          onSelectDelivery={onSelectDelivery}
          searchQuery={searchQuery}
          statusFilter={statusFilter}
        />

        {!isLoading && hasNextPage && (
          <div ref={loadMoreRef} className="flex justify-center py-4">
            {isLoadingMore && (
              <div className="text-sm text-gray-600">Daha fazla teslimat yükleniyor...</div>
            )}
          </div>
        )}

        {!hasNextPage && deliveries.length > 0 && (
          <div className="text-center py-4 text-sm text-gray-500">
            Tüm teslimatlar yüklendi
          </div>
        )}
      </div>
    </div>
  );
};

export default DeliveriesContent;
