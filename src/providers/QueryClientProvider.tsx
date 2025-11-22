
import React from "react";
import { QueryClient, QueryClientProvider as ReactQueryClientProvider } from "@tanstack/react-query";

/**
 * Centralized cache configuration
 * 
 * Cache Strategy:
 * - staleTime: How long data is considered fresh (default: 5 minutes)
 * - gcTime: How long unused data stays in cache (default: 10 minutes)
 * - refetchOnWindowFocus: Refetch when window regains focus (default: false for better UX)
 * - refetchOnReconnect: Refetch when network reconnects (default: true for data consistency)
 * - retry: Number of retry attempts (default: 1 for faster failure feedback)
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes - data is fresh for 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes - unused data stays in cache for 10 minutes
      refetchOnWindowFocus: false, // Don't refetch on window focus (better UX)
      refetchOnReconnect: true, // Refetch when network reconnects (data consistency)
      refetchOnMount: true, // Refetch on component mount if data is stale
      retry: 1, // Retry once on failure
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    },
    mutations: {
      retry: 0, // Don't retry mutations
    },
  },
});

export const QueryClientProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ReactQueryClientProvider client={queryClient}>
      {children}
    </ReactQueryClientProvider>
  );
};
