import React from "react";
import { useToast } from "@/components/ui/use-toast";
import { Proposal } from "@/types/proposal";
import ProposalTable from "./ProposalTable";
import InfiniteScroll from "@/components/ui/infinite-scroll";

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
        
        {/* Infinite scroll trigger - ProposalTable InfiniteScroll kullanmıyor, bu yüzden burada gösteriyoruz */}
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
        
        {/* Tüm teklifler yüklendi mesajı */}
        {!hasNextPage && proposals.length > 0 && !isLoading && (
          <div className="text-center py-4 text-sm text-gray-500">
            Tüm teklifler yüklendi ({totalCount || proposals.length} teklif)
          </div>
        )}
      </div>
    </div>
  );
};

export default ProposalsContent;
