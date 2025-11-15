import React from "react";
import DeliveriesTable from "./DeliveriesTable";
import { Delivery } from "@/types/deliveries";
import InfiniteScroll from "@/components/ui/infinite-scroll";

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

        {/* Infinite scroll trigger - DeliveriesTable InfiniteScroll kullanmıyor, bu yüzden burada gösteriyoruz */}
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

        {!hasNextPage && deliveries.length > 0 && !isLoading && (
          <div className="text-center py-4 text-sm text-gray-500">
            Tüm teslimatlar yüklendi
          </div>
        )}
      </div>
    </div>
  );
};

export default DeliveriesContent;
