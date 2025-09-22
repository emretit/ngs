
import { UseServiceRequestsResult } from "./types";
import { useServiceQueries } from "./useServiceQueries";
import { useServiceMutations } from "./useServiceMutations";

export const useServiceRequests = (): UseServiceRequestsResult => {
  const queries = useServiceQueries();
  const mutations = useServiceMutations();

  return {
    ...queries,
    ...mutations,
    data: queries.serviceRequests,
    isError: !!queries.error,
    getServiceRequest: (id: string) => queries.serviceRequests.find(req => req.id === id)
  };
};

// Re-export types for easy access
export * from "./types";
