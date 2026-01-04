
import React from "react";
import { QueryClient, QueryClientProvider as ReactQueryClientProvider } from "@tanstack/react-query";

/**
 * Centralized cache configuration
 * 
 * Cache Strategy:
 * - staleTime: How long data is considered fresh (default: 3 minutes)
 * - gcTime: How long unused data stays in cache (default: 10 minutes)
 * - refetchOnWindowFocus: Refetch when window regains focus (default: false for better UX)
 * - refetchOnReconnect: Refetch when network reconnects (default: true for data consistency)
 * - refetchOnMount: Refetch on mount if data is stale (default: true for data consistency)
 * - retry: Number of retry attempts (default: 1 for faster failure feedback)
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 3 * 60 * 1000, // 3 dakika - veri bu süre içinde fresh sayılır
      gcTime: 10 * 60 * 1000, // 10 dakika - cache'de kalma süresi
      refetchOnWindowFocus: false, // Pencere odaklanınca yenileme yapma (daha iyi UX)
      refetchOnReconnect: true, // Ağ bağlantısı döndüğünde yenile (veri tutarlılığı)
      refetchOnMount: true, // Mount'ta veri stale ise yenile (boş sayfa sorununu önler)
      retry: 1, // Hata durumunda 1 kez daha dene
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    },
    mutations: {
      retry: 0, // Mutation'larda yeniden deneme yapma
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
