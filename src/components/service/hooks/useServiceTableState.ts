
import { useState, useEffect } from "react";
import { ServiceRequest } from "@/hooks/useServiceRequests";
import type { SortField, SortDirection } from "@/components/activities/table/types";

interface UseServiceTableStateParams {
  serviceRequests: ServiceRequest[] | undefined;
  searchQuery: string;
  statusFilter: string | null;
  technicianFilter: string | null;
}

export const useServiceTableState = ({
  serviceRequests,
  searchQuery,
  statusFilter,
  technicianFilter
}: UseServiceTableStateParams) => {
  const [filteredRequests, setFilteredRequests] = useState<ServiceRequest[]>([]);
  const [sortField, setSortField] = useState<SortField>("title");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // Apply filters and sorting when dependencies change
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
    if (statusFilter) {
      results = results.filter((request) => request.status === statusFilter);
    }

    // Apply technician filter
    if (technicianFilter) {
      results = results.filter((request) => request.assigned_to === technicianFilter);
    }

    // Apply sorting
    setFilteredRequests(sortRequests(results, sortField, sortDirection));
  }, [serviceRequests, searchQuery, statusFilter, technicianFilter, sortField, sortDirection]);

  // Sort function
  const sortRequests = (requests: ServiceRequest[], field: SortField, direction: SortDirection) => {
    return [...requests].sort((a, b) => {
      let valueA, valueB;
      
      switch (field) {
        case "title":
          valueA = a.title.toLowerCase();
          valueB = b.title.toLowerCase();
          break;
        case "due_date":
          valueA = a.due_date ? new Date(a.due_date).getTime() : Number.MAX_SAFE_INTEGER;
          valueB = b.due_date ? new Date(b.due_date).getTime() : Number.MAX_SAFE_INTEGER;
          break;
        case "priority":
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          valueA = priorityOrder[a.priority];
          valueB = priorityOrder[b.priority];
          break;
        case "status":
          valueA = a.status;
          valueB = b.status;
          break;
        case "customer":
          valueA = a.customer_id || "";
          valueB = b.customer_id || "";
          break;
        case "assignee":
          valueA = a.assigned_to || "";
          valueB = b.assigned_to || "";
          break;
        default:
          valueA = a.title.toLowerCase();
          valueB = b.title.toLowerCase();
      }
      
      const compareResult = valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
      return direction === "asc" ? compareResult : -compareResult;
    });
  };

  // Handle sorting
  const handleSort = (field: SortField) => {
    if (field === sortField) {
      // Toggle direction if same field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // New field, default to ascending
      setSortField(field);
      setSortDirection("asc");
    }
  };

  return {
    filteredRequests,
    sortField,
    sortDirection,
    handleSort
  };
};
