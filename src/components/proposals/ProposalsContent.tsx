import React, { useEffect, useRef } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Proposal } from "@/types/proposal";
import ProposalTable from "./ProposalTable";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface ProposalsContentProps {
  proposals: Proposal[];
  isLoading: boolean;
  isLoadingMore?: boolean;
  hasNextPage?: boolean;
  loadMore?: () => void;
  totalCount?: number;
  error: any;
  onProposalSelect: (proposal: Proposal) => void;
  onStatusChange?: () => void;
  searchQuery?: string;
  statusFilter?: string;
  employeeFilter?: string;
}

const ProposalsContent = ({
  proposals,
  isLoading,
  isLoadingMore = false,
  hasNextPage = false,
  loadMore,
  totalCount,
  error,
  onProposalSelect,
  onStatusChange,
  searchQuery,
  statusFilter,
  employeeFilter
}: ProposalsContentProps) => {
  const { toast } = useToast();
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!loadMore || !hasNextPage || isLoadingMore || isLoading) return;

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
  }, [loadMore, hasNextPage, isLoadingMore, isLoading]);

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-red-500">Teklifler yüklenirken bir hata oluştu.</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="pb-6">
        <div className="-mx-4">
          <div className="px-4">
            <ProposalTable
            proposals={proposals}
            isLoading={isLoading}
            onProposalSelect={onProposalSelect}
            onStatusChange={onStatusChange}
            searchQuery={searchQuery}
            statusFilter={statusFilter}
            employeeFilter={employeeFilter}
            />
          </div>
        </div>
        
        {/* Infinite scroll trigger */}
        {hasNextPage && !isLoading && (
          <div ref={loadMoreRef} className="flex justify-center py-4">
            {isLoadingMore && (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-gray-600">Daha fazla teklif yükleniyor...</span>
              </div>
            )}
          </div>
        )}
        
        {/* Tüm teklifler yüklendi mesajı */}
        {!hasNextPage && proposals.length > 0 && (
          <div className="text-center py-4 text-sm text-gray-500">
            Tüm teklifler yüklendi ({totalCount || proposals.length} teklif)
          </div>
        )}
      </div>
    </div>
  );
};

export default ProposalsContent;
