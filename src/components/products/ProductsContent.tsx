import React from "react";
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
  onSelectAll?: (checked: boolean) => void;
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
  onSelectAll,
  selectedProducts = [],
  searchQuery,
  categoryFilter,
  stockFilter
}: ProductsContentProps) => {
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
            onSelectAll={onSelectAll}
            selectedProducts={selectedProducts}
          />
        )}
        
        {/* Tüm ürünler yüklendi mesajı - sadece table view için değil, grid view için de */}
        {!hasNextPage && products.length > 0 && !isLoading && (
          <div className="text-center py-4 text-sm text-gray-500">
            Tüm ürünler yüklendi
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductsContent;

