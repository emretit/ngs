import React from "react";
import { Opportunity } from "@/types/crm";
import OpportunitiesTable from "./OpportunitiesTable";

interface OpportunitiesContentProps {
  opportunities: Opportunity[];
  isLoading: boolean;
  totalCount?: number;
  error: any;
  onSelectOpportunity: (opportunity: Opportunity) => void;
  onEditOpportunity?: (opportunity: Opportunity) => void;
  onDeleteOpportunity?: (opportunity: Opportunity) => void;
  onConvertToProposal?: (opportunity: Opportunity) => void;
  onStatusChange?: (opportunityId: string, status: string) => void;
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
  totalCount,
  error,
  onSelectOpportunity,
  onEditOpportunity,
  onDeleteOpportunity,
  onConvertToProposal,
  onStatusChange,
  searchQuery,
  statusFilter,
  priorityFilter,
  sortField,
  sortDirection,
  onSort
}: OpportunitiesContentProps) => {
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
            onStatusChange={onStatusChange}
            searchQuery={searchQuery}
            statusFilter={statusFilter}
            priorityFilter={priorityFilter}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={onSort}
            />
          </div>
        </div>
        
        {/* Toplam fırsat sayısı */}
        {opportunities.length > 0 && !isLoading && (
          <div className="text-center py-4 text-sm text-gray-500">
            {totalCount || opportunities.length} fırsat
          </div>
        )}
      </div>
    </div>
  );
};

export default OpportunitiesContent;
