
import { UseServiceRequestsResult } from "./types";
import { useServiceQueries } from "./useServiceQueries";
import { useServiceMutations } from "./useServiceMutations";

export const useServiceRequests = (): UseServiceRequestsResult => {
  const queries = useServiceQueries();
  const mutations = useServiceMutations();

  return {
    ...queries,
    ...mutations
  };
};

// Re-export types for easy access
export * from "./types";
