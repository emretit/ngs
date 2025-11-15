import React from "react";
import PurchaseOrdersTable from "./PurchaseOrdersTable";
import InfiniteScroll from "@/components/ui/infinite-scroll";
import { PurchaseOrder } from "@/hooks/usePurchaseOrders";

interface PurchaseOrdersContentProps {
  orders: PurchaseOrder[];
  isLoading: boolean;
  isLoadingMore?: boolean;
  hasNextPage?: boolean;
  loadMore?: () => void;
  totalCount?: number;
  error: any;
  onOrderSelect: (order: PurchaseOrder) => void;
}

const PurchaseOrdersContent = ({
  orders,
  isLoading,
  isLoadingMore = false,
  hasNextPage = false,
  loadMore,
  totalCount,
  error,
  onOrderSelect,
}: PurchaseOrdersContentProps) => {

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
        <div className="flex flex-col items-center justify-center text-center space-y-3">
          <div className="rounded-full bg-red-100 p-3">
            <svg
              className="h-6 w-6 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Bir hata oluştu</h3>
            <p className="text-sm text-muted-foreground">
              Siparişler yüklenirken bir sorun oluştu.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="p-6">
        {/* Toplam sayı göstergesi */}
        {totalCount !== undefined && totalCount > 0 && (
          <div className="mb-4 text-sm text-muted-foreground">
            Toplam <span className="font-semibold text-foreground">{totalCount}</span> sipariş bulundu
            {orders.length < totalCount && ` (${orders.length} gösteriliyor)`}
          </div>
        )}

        {/* Table */}
        <PurchaseOrdersTable
          orders={orders}
          isLoading={isLoading}
          onOrderSelect={onOrderSelect}
        />

        {/* Infinite scroll trigger - PurchaseOrdersTable InfiniteScroll kullanmıyor, bu yüzden burada gösteriyoruz */}
        {hasNextPage && !isLoading && (
          <div className="py-6 border-t mt-6">
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

        {/* Tüm siparişler yüklendi mesajı */}
        {!hasNextPage && orders.length > 0 && totalCount && orders.length >= totalCount && !isLoading && (
          <div className="text-center py-6 border-t mt-6">
            <p className="text-sm text-muted-foreground">
              Tüm siparişler yüklendi
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(PurchaseOrdersContent);
