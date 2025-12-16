import React from "react";
import BudgetsTable from "./list/BudgetsTable";
import InfiniteScroll from "@/components/ui/infinite-scroll";
import { BudgetYearSummary } from "@/hooks/useBudgetsList";

interface BudgetsContentProps {
  budgets: BudgetYearSummary[];
  isLoading: boolean;
  isLoadingMore?: boolean;
  hasNextPage?: boolean;
  loadMore?: () => void;
  totalCount?: number;
  error?: any;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (field: string) => void;
}

const BudgetsContent = ({
  budgets,
  isLoading,
  isLoadingMore = false,
  hasNextPage = false,
  loadMore,
  totalCount,
  error,
  sortField,
  sortDirection,
  onSort
}: BudgetsContentProps) => {

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-red-500">Bütçeler yüklenirken bir hata oluştu.</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="pb-6">
        <BudgetsTable
          budgets={budgets}
          isLoading={isLoading}
          totalCount={totalCount || 0}
          error={error}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={onSort}
        />
        
        {/* Infinite scroll trigger */}
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
        
        {/* Tüm bütçeler yüklendi mesajı */}
        {!hasNextPage && budgets.length > 0 && !isLoading && (
          <div className="text-center py-4 text-sm text-gray-500">
            Tüm bütçeler yüklendi
          </div>
        )}
      </div>
    </div>
  );
};

export default BudgetsContent;

