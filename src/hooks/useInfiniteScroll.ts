import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export interface InfiniteScrollOptions {
  pageSize?: number;
  enabled?: boolean;
  refetchOnWindowFocus?: boolean;
  refetchOnMount?: boolean;
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
    refetchOnMount = false, // Cache'den veri varsa mount'ta refetch yapma
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
    refetchOnMount, // Cache'den veri varsa mount'ta refetch yapma
    staleTime,
    gcTime,
    placeholderData: (previousData) => previousData, // Önceki veriyi göster (smooth transition)
  });

  // İlk sayfa verisi geldiğinde state'i güncelle
  useEffect(() => {
    if (firstPageData?.data) {
      // Sadece veri gerçekten değiştiyse state'i güncelle
      setAllData(prev => {
        // Aynı veri varsa güncelleme yapma
        if (prev.length === firstPageData.data.length && 
            prev.length > 0 && 
            prev[0]?.id === firstPageData.data[0]?.id) {
          return prev;
        }
        return firstPageData.data;
      });
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

    // Eğer totalCount varsa ve mevcut sayfa toplam sayfayı aşıyorsa, daha fazla veri yok
    if (totalCount !== undefined && currentPage * pageSize >= totalCount) {
      setHasNextPage(false);
      return;
    }

    setIsLoadingMore(true);
    const nextPage = currentPage + 1;

    // Cancel previous request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      // Önce cache'den kontrol et
      const cacheKey = [...memoizedQueryKey, 'page', nextPage, 'size', pageSize];
      const cachedData = queryClient.getQueryData(cacheKey);
      
      if (cachedData) {
        // Cache'den veri varsa kullan
        const result = cachedData as { data: T[]; totalCount?: number; hasNextPage?: boolean };
        if (result?.data) {
          // Duplicate'leri önlemek için yeni verileri filtrele
          setAllData(prev => {
            const existingIds = new Set(prev.map((item: any) => item.id));
            const newItems = result.data.filter((item: any) => !existingIds.has(item.id));
            return [...prev, ...newItems];
          });
          setCurrentPage(nextPage);
          setHasNextPage(result.hasNextPage ?? result.data.length === pageSize);
          if (result.totalCount) {
            setTotalCount(result.totalCount);
          }
        }
      } else {
        // Cache'de yoksa API'den çek
        const result = await queryClient.fetchQuery({
          queryKey: cacheKey,
          queryFn: () => queryFn(nextPage, pageSize),
          staleTime,
          gcTime,
        });

        if (result?.data) {
          // Duplicate'leri önlemek için yeni verileri filtrele
          setAllData(prev => {
            const existingIds = new Set(prev.map((item: any) => item.id));
            const newItems = result.data.filter((item: any) => !existingIds.has(item.id));
            return [...prev, ...newItems];
          });
          setCurrentPage(nextPage);
          setHasNextPage(result.hasNextPage ?? result.data.length === pageSize);
          if (result.totalCount) {
            setTotalCount(result.totalCount);
          }
        }
      }
    } catch (err: any) {
      // PGRST103: Range Not Satisfiable - daha fazla veri yok, normal durum
      if (err?.code === 'PGRST103' || err?.message?.includes('Range Not Satisfiable')) {
        setHasNextPage(false);
        return;
      }
      console.error('Error loading more data:', err);
      // Hata durumunda kullanıcıya daha anlamlı mesaj göster
      if (err instanceof Error && err.message.includes("company_id")) {
        console.warn("Kullanıcı şirket bilgileri yüklenemedi, veriler gösterilemiyor");
      }
      // Diğer hatalarda da hasNextPage'i false yap
      setHasNextPage(false);
    } finally {
      setIsLoadingMore(false);
      abortControllerRef.current = null;
    }
  }, [currentPage, hasNextPage, isLoadingMore, queryFn, pageSize, memoizedQueryKey, queryClient, staleTime, gcTime, totalCount]);

  // Yenileme fonksiyonu - tüm sayfaları yenile
  const refresh = useCallback(() => {
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Tüm sayfaları invalidate et (silme işleminden sonra cache temizlenmeli)
    queryClient.invalidateQueries({ 
      queryKey: memoizedQueryKey,
      exact: false // Tüm alt query'leri de invalidate et
    });
    
    // State'i sıfırla
    setAllData([]);
    setCurrentPage(1);
    setHasNextPage(true);
    setIsLoadingMore(false);
    setTotalCount(undefined);
  }, [queryClient, memoizedQueryKey]);

  // Cleanup effect for unmounting
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Cache'den veri varsa onu kullan, yoksa allData'yı kullan
  // allData boşsa ve firstPageData varsa onu kullan (cache'den gelen veri)
  // allData doluysa onu kullan (loadMore ile yüklenen veriler dahil)
  const displayData = allData.length > 0 ? allData : (firstPageData?.data || []);

  return {
    data: displayData,
    isLoading,
    isLoadingMore,
    hasNextPage,
    error: error as Error | null,
    loadMore,
    refresh,
    totalCount,
  };
}