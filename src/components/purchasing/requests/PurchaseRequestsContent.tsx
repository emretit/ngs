import React, { useEffect, useRef } from "react";
import { useToast } from "@/components/ui/use-toast";
import PurchaseRequestTable from "./PurchaseRequestTable";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

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
          
          {/* Infinite scroll trigger */}
          {hasNextPage && (
            <div ref={loadMoreRef} className="flex justify-center py-4">
              {isLoadingMore ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-gray-600">Daha fazla talep yükleniyor...</span>
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
          
          {/* Tüm talepler yüklendi mesajı */}
          {!hasNextPage && requests.length > 0 && (
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

