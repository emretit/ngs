import React from "react";
import ReturnsTable from "./ReturnsTable";
import { Return } from "@/types/returns";
import InfiniteScroll from "@/components/ui/infinite-scroll";

interface ReturnsContentProps {
  returns: Return[];
  isLoading: boolean;
  error: any;
  onSelectReturn: (returnItem: Return) => void;
  searchQuery?: string;
  statusFilter?: string;
  isLoadingMore?: boolean;
  hasNextPage?: boolean;
  loadMore?: () => void;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (field: string) => void;
}

const ReturnsContent = ({
  returns,
  isLoading,
  error,
  onSelectReturn,
  searchQuery,
  statusFilter,
  isLoadingMore = false,
  hasNextPage = false,
  loadMore,
  sortField,
  sortDirection,
  onSort
}: ReturnsContentProps) => {
  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-red-500">İadeler yüklenirken bir hata oluştu.</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="pb-6">
        <ReturnsTable
          returns={returns}
          isLoading={isLoading}
          onSelectReturn={onSelectReturn}
          searchQuery={searchQuery}
          statusFilter={statusFilter}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={onSort}
        />

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

        {!hasNextPage && returns.length > 0 && !isLoading && (
          <div className="text-center py-4 text-sm text-gray-500">
            Tüm iadeler yüklendi
          </div>
        )}
      </div>
    </div>
  );
};

export default ReturnsContent;
