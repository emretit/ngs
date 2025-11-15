import React from "react";
import { useToast } from "@/components/ui/use-toast";
import PurchaseRequestTable from "./PurchaseRequestTable";
import InfiniteScroll from "@/components/ui/infinite-scroll";

interface PurchaseRequestsContentProps {
  requests: any[];
  isLoading: boolean;
  isLoadingMore?: boolean;
  hasNextPage?: boolean;
  loadMore?: () => void;
  totalCount?: number;
  error: any;
  onRequestSelect: (request: any) => void;
  onStatusChange?: () => void;
  searchQuery?: string;
  statusFilter?: string;
  priorityFilter?: string;
}

const PurchaseRequestsContent = ({
  requests,
  isLoading,
  isLoadingMore = false,
  hasNextPage = false,
  loadMore,
  totalCount,
  error,
  onRequestSelect,
  onStatusChange,
  searchQuery,
  statusFilter,
  priorityFilter
}: PurchaseRequestsContentProps) => {
  const { toast } = useToast();

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-red-500">Talepler yüklenirken bir hata oluştu.</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="p-6 bg-white rounded-xl relative overflow-hidden">
        <div className="relative z-10">
          <PurchaseRequestTable
            requests={requests}
            isLoading={isLoading}
            onRequestSelect={onRequestSelect}
            onStatusChange={onStatusChange}
          />
          
          {/* Infinite scroll trigger - PurchaseRequestTable InfiniteScroll kullanmıyor, bu yüzden burada gösteriyoruz */}
          {hasNextPage && !isLoading && (
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
          
          {/* Tüm talepler yüklendi mesajı */}
          {!hasNextPage && requests.length > 0 && !isLoading && (
            <div className="text-center py-4 text-sm text-gray-500">
              Tüm talepler yüklendi
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(PurchaseRequestsContent);

