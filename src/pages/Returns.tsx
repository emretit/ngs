import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import ReturnsHeader from "@/components/returns/ReturnsHeader";
import ReturnsFilterBar from "@/components/returns/ReturnsFilterBar";
import ReturnsContent from "@/components/returns/ReturnsContent";
import ReturnForm from "@/components/returns/ReturnForm";
import ReturnDetailSheet from "@/components/returns/ReturnDetailSheet";
import { useReturnsInfiniteScroll } from "@/hooks/useReturnsInfiniteScroll";
import { Return } from "@/types/returns";

interface ReturnsProps {
  isCollapsed?: boolean;
  setIsCollapsed?: (collapsed: boolean) => void;
}

const Returns = ({ isCollapsed, setIsCollapsed }: ReturnsProps) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [reasonFilter, setReasonFilter] = useState("all");
  const [customerFilter, setCustomerFilter] = useState("all");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [selectedReturnId, setSelectedReturnId] = useState<string | null>(null);
  const [showDetailSheet, setShowDetailSheet] = useState(false);
  
  const [sortField, setSortField] = useState<string>("created_at");
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const {
    data: returns = [],
    isLoading,
    isLoadingMore,
    hasNextPage,
    loadMore,
    totalCount,
    error
  } = useReturnsInfiniteScroll({
    search: searchQuery,
    status: statusFilter,
    return_type: typeFilter,
    return_reason: reasonFilter,
    customer_id: customerFilter,
    startDate,
    endDate,
    sortField,
    sortDirection
  });

  const handleReturnClick = (returnItem: Return) => {
    setSelectedReturnId(returnItem.id);
    setShowDetailSheet(true);
  };

  const handleCreateReturn = () => {
    setShowReturnForm(true);
  };

  const handleCloseReturnForm = () => {
    setShowReturnForm(false);
  };

  const handleCloseDetailSheet = () => {
    setShowDetailSheet(false);
    setSelectedReturnId(null);
  };

  return (
    <div className="space-y-4 p-4">
      <ReturnsHeader
        returns={returns}
        onCreateReturn={handleCreateReturn}
      />
      
      <ReturnsFilterBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedStatus={statusFilter}
        setSelectedStatus={setStatusFilter}
        selectedType={typeFilter}
        setSelectedType={setTypeFilter}
        selectedReason={reasonFilter}
        setSelectedReason={setReasonFilter}
        selectedCustomer={customerFilter}
        setSelectedCustomer={setCustomerFilter}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
      />
      
      <ReturnsContent
        returns={returns}
        isLoading={isLoading}
        error={error}
        onSelectReturn={handleReturnClick}
        searchQuery={searchQuery}
        statusFilter={statusFilter}
        isLoadingMore={isLoadingMore}
        hasNextPage={hasNextPage}
        loadMore={loadMore}
        sortField={sortField}
        sortDirection={sortDirection}
        onSort={handleSort}
      />

      <ReturnForm
        open={showReturnForm}
        onClose={handleCloseReturnForm}
      />

      <ReturnDetailSheet
        returnId={selectedReturnId}
        open={showDetailSheet}
        onClose={handleCloseDetailSheet}
      />
    </div>
  );
};

export default Returns;
