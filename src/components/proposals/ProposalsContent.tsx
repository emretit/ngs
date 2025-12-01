import React from "react";
import { Proposal } from "@/types/proposal";
import ProposalTable from "./ProposalTable";

interface ProposalsContentProps {
  proposals: Proposal[];
  isLoading: boolean;
  totalCount?: number;
  error: any;
  onProposalSelect: (proposal: Proposal) => void;
  onStatusChange?: () => void;
  searchQuery?: string;
  statusFilter?: string;
  employeeFilter?: string;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (field: string) => void;
}

const ProposalsContent = ({
  proposals,
  isLoading,
  totalCount,
  error,
  onProposalSelect,
  onStatusChange,
  searchQuery,
  statusFilter,
  employeeFilter,
  sortField,
  sortDirection,
  onSort
}: ProposalsContentProps) => {
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
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={onSort}
            />
          </div>
        </div>
        
        {/* Toplam teklif sayısı */}
        {proposals.length > 0 && !isLoading && (
          <div className="text-center py-4 text-sm text-gray-500">
            {totalCount || proposals.length} teklif
          </div>
        )}
      </div>
    </div>
  );
};

export default ProposalsContent;
