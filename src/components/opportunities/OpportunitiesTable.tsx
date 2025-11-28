
import React, { useState } from "react";
import { Table, TableBody } from "@/components/ui/table";
import { Opportunity } from "@/types/crm";
import OpportunitiesTableHeader from "./table/OpportunitiesTableHeader";
import OpportunitiesTableRow from "./table/OpportunitiesTableRow";
import OpportunitiesTableEmpty from "./table/OpportunitiesTableEmpty";
import OpportunitiesTableLoading from "./table/OpportunitiesTableLoading";
import { useSortedOpportunities } from "./table/useSortedOpportunities";
import { useOpportunityStatusUpdate } from "./hooks/useOpportunityStatusUpdate";
import type { OpportunitySortField, OpportunitySortDirection } from "./table/OpportunitiesTableHeader";

interface OpportunitiesTableProps {
  opportunities: Opportunity[];
  isLoading: boolean;
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

const OpportunitiesTable = ({
  opportunities,
  isLoading,
  onSelectOpportunity,
  onEditOpportunity,
  onDeleteOpportunity,
  onConvertToProposal,
  searchQuery = "",
  statusFilter = "all",
  priorityFilter = null,
  sortField: externalSortField,
  sortDirection: externalSortDirection,
  onSort: externalOnSort
}: OpportunitiesTableProps) => {
  // Fallback için internal state (eğer dışarıdan prop geçilmezse)
  const [internalSortField, setInternalSortField] = useState<OpportunitySortField>("created_at");
  const [internalSortDirection, setInternalSortDirection] = useState<OpportunitySortDirection>("desc");
  
  // Dışarıdan prop geçilmişse onu kullan, yoksa internal state kullan
  const sortField = (externalSortField as OpportunitySortField) ?? internalSortField;
  const sortDirection = (externalSortDirection as OpportunitySortDirection) ?? internalSortDirection;
  
  const { updateOpportunityStatus } = useOpportunityStatusUpdate();

  const handleSort = (field: OpportunitySortField) => {
    // Eğer dışarıdan onSort prop'u geçilmişse onu kullan (veritabanı seviyesinde sıralama)
    if (externalOnSort) {
      externalOnSort(field);
    } else {
      // Fallback: client-side sıralama
      if (field === internalSortField) {
        setInternalSortDirection(internalSortDirection === "asc" ? "desc" : "asc");
      } else {
        setInternalSortField(field);
        setInternalSortDirection("asc");
      }
    }
  };

  // Filter opportunities based on criteria
  const filteredOpportunities = opportunities.filter(opportunity => {
    const matchesSearch = !searchQuery || 
      opportunity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (opportunity.description && opportunity.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (opportunity.customer?.name?.toLowerCase() || "").includes(searchQuery.toLowerCase());
      
    const matchesStatus = statusFilter === "all" || opportunity.status === statusFilter;
    const matchesPriority = !priorityFilter || opportunity.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Eğer dışarıdan sıralama geçilmişse (veritabanı seviyesinde sıralama), 
  // client-side sıralama YAPMA çünkü veriler zaten sıralı geliyor.
  // Aksi halde fallback olarak client-side sıralama yap.
  const sortedOpportunities = externalOnSort 
    ? filteredOpportunities // Veritabanından sıralı geliyor, tekrar sıralama
    : useSortedOpportunities(filteredOpportunities, sortField, sortDirection);

  if (isLoading) {
    return <OpportunitiesTableLoading />;
  }

  return (
    <Table>
      <OpportunitiesTableHeader 
        sortField={sortField} 
        sortDirection={sortDirection}
        handleSort={handleSort}
      />
      <TableBody>
        {sortedOpportunities.length === 0 ? (
          <OpportunitiesTableEmpty />
        ) : (
          sortedOpportunities.map((opportunity) => (
            <OpportunitiesTableRow
              key={opportunity.id}
              opportunity={opportunity}
              onSelectOpportunity={onSelectOpportunity}
              onEditOpportunity={onEditOpportunity}
              onDeleteOpportunity={onDeleteOpportunity}
              onConvertToProposal={onConvertToProposal}
              onStatusChange={updateOpportunityStatus}
            />
          ))
        )}
      </TableBody>
    </Table>
  );
};

export default OpportunitiesTable;
