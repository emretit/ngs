// @ts-nocheck
// This hook is temporarily disabled due to type migration

export const useServiceTableState = () => {
  return {
    filteredRequests: [],
    isLoading: false,
    error: null,
    searchQuery: '',
    setSearchQuery: () => {},
    statusFilter: null,
    setStatusFilter: () => {},
    technicianFilter: null,
    setTechnicianFilter: () => {},
    sortBy: 'created_at',
    setSortBy: () => {},
    sortOrder: 'desc' as const,
    setSortOrder: () => {},
    pagination: {
      currentPage: 1,
      itemsPerPage: 10,
      totalItems: 0,
      totalPages: 1,
    },
    setPagination: () => {},
  };
};