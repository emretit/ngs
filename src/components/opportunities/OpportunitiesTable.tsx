
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
  searchQuery?: string;
  statusFilter?: string;
  priorityFilter?: string;
}

const OpportunitiesTable = ({
  opportunities,
  isLoading,
  onSelectOpportunity,
  onEditOpportunity,
  onDeleteOpportunity,
  searchQuery = "",
  statusFilter = "all",
  priorityFilter = null
}: OpportunitiesTableProps) => {
  const [sortField, setSortField] = useState<OpportunitySortField>("created_at");
  const [sortDirection, setSortDirection] = useState<OpportunitySortDirection>("desc");
  const { updateOpportunityStatus } = useOpportunityStatusUpdate();

  const handleSort = (field: OpportunitySortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
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

  // Sort the filtered opportunities
  const sortedOpportunities = useSortedOpportunities(filteredOpportunities, sortField, sortDirection);

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
              onStatusChange={updateOpportunityStatus}
            />
          ))
        )}
      </TableBody>
    </Table>
  );
};

export default OpportunitiesTable;
