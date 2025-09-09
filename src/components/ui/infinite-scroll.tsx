import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface InfiniteScrollProps {
  children: React.ReactNode;
  hasNextPage: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
  className?: string;
  threshold?: number;
  rootMargin?: string;
  showLoadMoreButton?: boolean;
  loadingText?: string;
  loadMoreText?: string;
  error?: Error | null;
  onRetry?: () => void;
  emptyState?: React.ReactNode;
  isEmpty?: boolean;
}

export const InfiniteScroll: React.FC<InfiniteScrollProps> = ({
  children,
  hasNextPage,
  isLoadingMore,
  onLoadMore,
  className,
  threshold = 0.1,
  rootMargin = '100px',
  showLoadMoreButton = true,
  loadingText = 'Daha fazla yükleniyor...',
  loadMoreText = 'Daha Fazla Yükle',
  error,
  onRetry,
  emptyState,
  isEmpty = false,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Intersection Observer ile otomatik yükleme (optimized)
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasNextPage || isLoadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !isLoadingMore) {
          setIsVisible(true);
          // Debounce with requestAnimationFrame for better performance
          requestAnimationFrame(() => {
            if (!isLoadingMore) {
              onLoadMore();
            }
          });
        } else {
          setIsVisible(false);
        }
      },
      {
        threshold,
        rootMargin,
        // Performance optimization: don't observe when not needed
        ...(rootMargin && { root: null }),
      }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect(); // Use disconnect() instead of unobserve() for better cleanup
    };
  }, [hasNextPage, isLoadingMore, onLoadMore, threshold, rootMargin]);

  // Error state
  if (error) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12 px-4', className)}>
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h3 className="text-lg font-semibold text-destructive mb-2">
          Veri yüklenirken hata oluştu
        </h3>
        <p className="text-muted-foreground text-center mb-4">
          {error.message || 'Bir hata oluştu. Lütfen tekrar deneyin.'}
        </p>
        {onRetry && (
          <Button onClick={onRetry} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Tekrar Dene
          </Button>
        )}
      </div>
    );
  }

  // Empty state
  if (isEmpty && emptyState) {
    return (
      <div className={cn('flex items-center justify-center py-12', className)}>
        {emptyState}
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Ana içerik */}
      {children}

      {/* Loading more indicator */}
      {isLoadingMore && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">{loadingText}</span>
        </div>
      )}

      {/* Load more button (accessibility için) */}
      {showLoadMoreButton && hasNextPage && !isLoadingMore && (
        <div className="flex justify-center py-4">
          <Button
            onClick={onLoadMore}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            {loadMoreText}
          </Button>
        </div>
      )}

      {/* Sentinel element - görünürlük tespiti için */}
      {hasNextPage && !isLoadingMore && (
        <div
          ref={sentinelRef}
          className="h-4 w-full"
          aria-hidden="true"
        />
      )}

      {/* End of content indicator */}
      {!hasNextPage && !isEmpty && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          Tüm veriler yüklendi
        </div>
      )}
    </div>
  );
};

// Virtualized Infinite Scroll için alternatif component
export interface VirtualizedInfiniteScrollProps extends Omit<InfiniteScrollProps, 'children'> {
  items: any[];
  itemHeight: number;
  containerHeight?: number;
  renderItem: (item: any, index: number) => React.ReactNode;
  overscan?: number;
}

export const VirtualizedInfiniteScroll: React.FC<VirtualizedInfiniteScrollProps> = ({
  items,
  itemHeight,
  containerHeight = 400,
  renderItem,
  hasNextPage,
  isLoadingMore,
  onLoadMore,
  className,
  threshold = 0.1,
  rootMargin = '100px',
  overscan = 5,
  ...props
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const totalHeight = items.length * itemHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const visibleItems = items.slice(startIndex, endIndex + 1);
  const offsetY = startIndex * itemHeight;

  // Intersection Observer
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasNextPage || isLoadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setTimeout(() => onLoadMore(), 100);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(sentinel);
    return () => observer.unobserve(sentinel);
  }, [hasNextPage, isLoadingMore, onLoadMore, threshold, rootMargin]);

  return (
    <div className={cn('relative overflow-auto', className)} style={{ height: containerHeight }}>
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map((item, index) => (
            <div key={startIndex + index} style={{ height: itemHeight }}>
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>

      {/* Loading indicator */}
      {isLoadingMore && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Daha fazla yükleniyor...</span>
        </div>
      )}

      {/* Sentinel */}
      {hasNextPage && !isLoadingMore && (
        <div ref={sentinelRef} className="h-4 w-full" />
      )}
    </div>
  );
};

export default InfiniteScroll;
