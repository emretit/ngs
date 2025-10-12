
import React from "react";
import { QueryClient, QueryClientProvider as ReactQueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 60 * 1000, // 10 dk - daha uzun cache
      gcTime: 15 * 60 * 1000, // 15 dk
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: 1,
      refetchInterval: false, // Otomatik refetch kapalı
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
