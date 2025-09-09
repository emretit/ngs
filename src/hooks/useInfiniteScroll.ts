import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export interface InfiniteScrollOptions {
  pageSize?: number;
  enabled?: boolean;
  refetchOnWindowFocus?: boolean;
  staleTime?: number;
  gcTime?: number;
}

export interface InfiniteScrollResult<T> {
  data: T[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasNextPage: boolean;
  error: Error | null;
  loadMore: () => void;
  refresh: () => void;
  totalCount?: number;
}

export function useInfiniteScroll<T>(
  queryKey: string[],
  queryFn: (page: number, pageSize: number) => Promise<{ data: T[]; totalCount?: number; hasNextPage?: boolean }>,
  options: InfiniteScrollOptions = {}
): InfiniteScrollResult<T> {
  const {
    pageSize = 20,
    enabled = true,
    refetchOnWindowFocus = false,
    staleTime = 5 * 60 * 1000, // 5 minutes
    gcTime = 10 * 60 * 1000, // 10 minutes
  } = options;

  const [allData, setAllData] = useState<T[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [totalCount, setTotalCount] = useState<number | undefined>();
  const queryClient = useQueryClient();
  const abortControllerRef = useRef<AbortController | null>(null);

  // Memoize query key to prevent unnecessary re-renders
  const memoizedQueryKey = useMemo(() => queryKey, [queryKey.join(',')]);

  // İlk sayfa için query
  const { data: firstPageData, isLoading, error } = useQuery({
    queryKey: [...memoizedQueryKey, 'page', 1, 'size', pageSize],
    queryFn: () => queryFn(1, pageSize),
    enabled,
    refetchOnWindowFocus,
    staleTime,
    gcTime,
  });

  // İlk sayfa verisi geldiğinde state'i güncelle
  useEffect(() => {
    if (firstPageData?.data) {
      setAllData(firstPageData.data);
      setCurrentPage(1);
      setHasNextPage(firstPageData.hasNextPage ?? firstPageData.data.length === pageSize);
      if (firstPageData.totalCount !== undefined) {
        setTotalCount(firstPageData.totalCount);
      }
    }
  }, [firstPageData, pageSize]);

  // Daha fazla veri yükleme fonksiyonu
  const loadMore = useCallback(async () => {
    if (!hasNextPage || isLoadingMore) return;

    setIsLoadingMore(true);
    const nextPage = currentPage + 1;

    // Cancel previous request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      const result = await queryClient.fetchQuery({
        queryKey: [...memoizedQueryKey, 'page', nextPage, 'size', pageSize],
        queryFn: () => queryFn(nextPage, pageSize),
        staleTime,
        gcTime,
      });

      if (result?.data) {
        setAllData(prev => [...prev, ...result.data]);
        setCurrentPage(nextPage);
        setHasNextPage(result.hasNextPage ?? result.data.length === pageSize);
        if (result.totalCount) {
          setTotalCount(result.totalCount);
        }
      }
    } catch (err) {
      console.error('Error loading more data:', err);
    } finally {
      setIsLoadingMore(false);
      abortControllerRef.current = null;
    }
  }, [currentPage, hasNextPage, isLoadingMore, queryFn, pageSize, memoizedQueryKey, queryClient, staleTime, gcTime]);

  // Yenileme fonksiyonu
  const refresh = useCallback(() => {
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setAllData([]);
    setCurrentPage(1);
    setHasNextPage(true);
    setIsLoadingMore(false);
    setTotalCount(undefined);
    queryClient.invalidateQueries({ queryKey: memoizedQueryKey });
  }, [queryClient, memoizedQueryKey]);

  // Cleanup effect for unmounting
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    data: allData,
    isLoading,
    isLoadingMore,
    hasNextPage,
    error: error as Error | null,
    loadMore,
    refresh,
    totalCount,
  };
}