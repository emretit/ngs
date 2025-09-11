
import React, { useEffect, useRef } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Opportunity } from "@/types/crm";
import OpportunitiesTable from "./OpportunitiesTable";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface OpportunitiesContentProps {
  opportunities: Opportunity[];
  isLoading: boolean;
  isLoadingMore?: boolean;
  hasNextPage?: boolean;
  loadMore?: () => void;
  totalCount?: number;
  error: any;
  onSelectOpportunity: (opportunity: Opportunity) => void;
  searchQuery?: string;
  statusFilter?: string;
  priorityFilter?: string;
}

const OpportunitiesContent = ({
  opportunities,
  isLoading,
  isLoadingMore = false,
  hasNextPage = false,
  loadMore,
  totalCount,
  error,
  onSelectOpportunity,
  searchQuery,
  statusFilter,
  priorityFilter
}: OpportunitiesContentProps) => {
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
        <div className="text-red-500">Fırsatlar yüklenirken bir hata oluştu.</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="p-6 bg-white rounded-xl relative overflow-hidden">
        <div className="relative z-10">
          <OpportunitiesTable
            opportunities={opportunities}
            isLoading={isLoading}
            onSelectOpportunity={onSelectOpportunity}
            searchQuery={searchQuery}
            statusFilter={statusFilter}
            priorityFilter={priorityFilter}
          />
          
          {/* Infinite scroll trigger */}
          {hasNextPage && (
            <div ref={loadMoreRef} className="flex justify-center py-4">
              {isLoadingMore ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-gray-600">Daha fazla fırsat yükleniyor...</span>
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
          
          {/* Tüm fırsatlar yüklendi mesajı */}
          {!hasNextPage && opportunities.length > 0 && (
            <div className="text-center py-4 text-sm text-gray-500">
              Tüm fırsatlar yüklendi
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OpportunitiesContent;
