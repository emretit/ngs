import React from "react";
import { useToast } from "@/components/ui/use-toast";
import { Opportunity } from "@/types/crm";
import OpportunitiesTable from "./OpportunitiesTable";
import InfiniteScroll from "@/components/ui/infinite-scroll";

interface OpportunitiesContentProps {
  opportunities: Opportunity[];
  isLoading: boolean;
  isLoadingMore?: boolean;
  hasNextPage?: boolean;
  loadMore?: () => void;
  totalCount?: number;
  error: any;
  onSelectOpportunity: (opportunity: Opportunity) => void;
  onEditOpportunity?: (opportunity: Opportunity) => void;
  onDeleteOpportunity?: (opportunity: Opportunity) => void;
  onConvertToProposal?: (opportunity: Opportunity) => void;
  searchQuery?: string;
  statusFilter?: string;
  priorityFilter?: string;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (field: string) => void;
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
  onEditOpportunity,
  onDeleteOpportunity,
  onConvertToProposal,
  searchQuery,
  statusFilter,
  priorityFilter,
  sortField,
  sortDirection,
  onSort
}: OpportunitiesContentProps) => {
  const { toast } = useToast();

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-red-500">Fırsatlar yüklenirken bir hata oluştu.</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="pb-6">
        <div className="-mx-4">
          <div className="px-4">
            <OpportunitiesTable
            opportunities={opportunities}
            isLoading={isLoading}
            onSelectOpportunity={onSelectOpportunity}
            onEditOpportunity={onEditOpportunity}
            onDeleteOpportunity={onDeleteOpportunity}
            onConvertToProposal={onConvertToProposal}
            searchQuery={searchQuery}
            statusFilter={statusFilter}
            priorityFilter={priorityFilter}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={onSort}
            />
          </div>
        </div>
        
        {/* Infinite scroll trigger - OpportunitiesTable InfiniteScroll kullanmıyor, bu yüzden burada gösteriyoruz */}
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
        
        {/* Tüm fırsatlar yüklendi mesajı */}
        {!hasNextPage && opportunities.length > 0 && !isLoading && (
          <div className="text-center py-4 text-sm text-gray-500">
            Tüm fırsatlar yüklendi ({totalCount || opportunities.length} fırsat)
          </div>
        )}
      </div>
    </div>
  );
};

export default OpportunitiesContent;
