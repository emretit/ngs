
import { useState, useEffect } from "react";
import { useServiceRequests } from "@/hooks/service/useServiceRequests";
import { ServiceRequest } from "@/hooks/service/types";

export const useServiceRequestTable = (
  searchQuery: string,
  statusFilter: string | null,
  technicianFilter: string | null
) => {
  const [filteredRequests, setFilteredRequests] = useState<ServiceRequest[]>([]);
  const { 
    data: serviceRequests, 
    isLoading, 
    isError, 
    error,
    refetch
  } = useServiceRequests();

  // Apply filters when dependencies change
  useEffect(() => {
    if (!serviceRequests) return;

    let results = [...serviceRequests];

    // Apply search filter
    if (searchQuery) {
      results = results.filter(
        (request) =>
          request.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          request.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter && statusFilter !== 'all') {
      results = results.filter((request) => request.status === statusFilter);
    }

    // Apply technician filter
    if (technicianFilter && technicianFilter !== 'all') {
      results = results.filter((request) => request.assigned_to === technicianFilter);
    }

    setFilteredRequests(results);
  }, [serviceRequests, searchQuery, statusFilter, technicianFilter]);

  return {
    requests: filteredRequests,
    isLoading,
    isError,
    error,
    refetch
  };
};
