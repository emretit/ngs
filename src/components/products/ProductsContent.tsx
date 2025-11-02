import React, { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { Product } from "@/types/product";
import ProductListTable from "./ProductListTable";
import ProductGrid from "./ProductGrid";

interface ProductsContentProps {
  products: Product[];
  isLoading: boolean;
  isLoadingMore?: boolean;
  hasNextPage?: boolean;
  loadMore?: () => void;
  totalCount?: number;
  error: any;
  activeView: "grid" | "table";
  sortField: "name" | "price" | "stock_quantity" | "category";
  sortDirection: "asc" | "desc";
  onSortFieldChange: (field: "name" | "price" | "stock_quantity" | "category") => void;
  onProductClick: (product: Product) => void;
  onProductSelect: (product: Product) => void;
  selectedProducts?: Product[];
  searchQuery?: string;
  categoryFilter?: string;
  stockFilter?: string;
}

const ProductsContent = ({
  products,
  isLoading,
  isLoadingMore = false,
  hasNextPage = false,
  loadMore,
  totalCount,
  error,
  activeView,
  sortField,
  sortDirection,
  onSortFieldChange,
  onProductClick,
  onProductSelect,
  selectedProducts = [],
  searchQuery,
  categoryFilter,
  stockFilter
}: ProductsContentProps) => {
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!loadMore || !hasNextPage || isLoadingMore || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [loadMore, hasNextPage, isLoadingMore, isLoading]);

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-red-500">Ürünler yüklenirken bir hata oluştu.</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="pb-6">
        {activeView === "grid" ? (
          <ProductGrid
            products={products}
            isLoading={isLoading}
            isLoadingMore={isLoadingMore}
            hasNextPage={hasNextPage}
            loadMore={loadMore}
            onProductClick={onProductClick}
            onProductSelect={onProductSelect}
            selectedProducts={selectedProducts}
          />
        ) : (
          <ProductListTable
            products={products}
            isLoading={isLoading}
            isLoadingMore={isLoadingMore}
            hasNextPage={hasNextPage}
            loadMore={loadMore}
            totalCount={totalCount || 0}
            sortField={sortField}
            sortDirection={sortDirection}
            onSortFieldChange={onSortFieldChange}
            onProductClick={onProductClick}
            onProductSelect={onProductSelect}
            selectedProducts={selectedProducts}
          />
        )}
        
        {/* Infinite scroll trigger */}
        {!isLoading && hasNextPage && (
          <div ref={loadMoreRef} className="flex justify-center py-4">
            {isLoadingMore && (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-gray-600">Daha fazla ürün yükleniyor...</span>
              </div>
            )}
          </div>
        )}
        
        {/* Tüm ürünler yüklendi mesajı */}
        {!hasNextPage && products.length > 0 && (
          <div className="text-center py-4 text-sm text-gray-500">
            Tüm ürünler yüklendi
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductsContent;

