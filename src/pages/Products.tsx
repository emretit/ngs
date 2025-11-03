import { useState, useCallback, useEffect, memo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import ProductsHeader from "@/components/products/ProductsHeader";
import ProductsFilterBar from "@/components/products/ProductsFilterBar";
import ProductsContent from "@/components/products/ProductsContent";
import ProductsBulkActions from "@/components/products/ProductsBulkActions";
import { exportProductsToExcel } from "@/utils/excelUtils";
import { supabase } from "@/integrations/supabase/client";
import { useProductsInfiniteScroll } from "@/hooks/useProductsInfiniteScroll";
import { Product } from "@/types/product";
import { toast } from "sonner";

const Products = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeView, setActiveView] = useState<"grid" | "table">("table");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  
  // Debounced search query
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [sortField, setSortField] = useState<"name" | "price" | "stock_quantity" | "category">("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_categories")
        .select("id, name");

      if (error) throw error;
      return data;
    },
  });

  // Use products infinite scroll hook
  const {
    data: products,
    isLoading,
    isLoadingMore,
    hasNextPage,
    loadMore,
    refresh,
    totalCount,
    error
  } = useProductsInfiniteScroll({
    search: debouncedSearchQuery,
    category: categoryFilter,
    stock: stockFilter,
    sortField,
    sortDirection
  });

  if (error) {
    toast.error("Ürünler yüklenirken bir hata oluştu");
    console.error("Error loading products:", error);
  }

  const handleSort = useCallback((field: "name" | "price" | "stock_quantity" | "category") => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection(field === "price" || field === "stock_quantity" ? "desc" : "asc");
    }
  }, [sortField, sortDirection]);

  const handleProductClick = useCallback((product: Product) => {
    navigate(`/product-details/${product.id}`);
  }, [navigate]);

  const handleProductSelect = useCallback((product: Product) => {
    setSelectedProducts(prev => {
      const isSelected = prev.some(p => p.id === product.id);
      return isSelected
        ? prev.filter(p => p.id !== product.id)
        : [...prev, product];
    });
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedProducts([]);
  }, []);

  const handleBulkAction = useCallback(async (action: string) => {
    if (action === 'export') {
      exportProductsToExcel(selectedProducts);
    } else {
      console.log('Bulk action:', action, selectedProducts);
      // Implement other bulk actions here
    }
  }, [selectedProducts]);

  const handleImportSuccess = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['products'] });
    refresh();
  }, [queryClient, refresh]);

  return (
    <div className="space-y-2">
      {/* Header */}
      <ProductsHeader 
        products={products || []}
        activeView={activeView}
        setActiveView={setActiveView}
      />
      
      {/* Filters */}
      <ProductsFilterBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        stockFilter={stockFilter}
        setStockFilter={setStockFilter}
        categories={categories}
      />
      
      {/* Bulk Actions - Always visible */}
      <ProductsBulkActions 
        selectedProducts={selectedProducts}
        onClearSelection={handleClearSelection}
        onBulkAction={handleBulkAction}
        onImportSuccess={handleImportSuccess}
      />
      
      {isLoading ? (
        <div className="flex items-center justify-center h-[400px]">
          <div className="text-center space-y-4">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-muted-foreground">Ürünler yükleniyor...</p>
          </div>
        </div>
      ) : error ? (
        <div className="h-96 flex items-center justify-center">
          <div className="text-red-500">Ürünler yüklenirken bir hata oluştu</div>
        </div>
      ) : (
        <ProductsContent
          products={products || []}
          isLoading={isLoading}
          isLoadingMore={isLoadingMore}
          hasNextPage={hasNextPage}
          loadMore={loadMore}
          totalCount={totalCount}
          error={error}
          activeView={activeView}
          sortField={sortField}
          sortDirection={sortDirection}
          onSortFieldChange={handleSort}
          onProductClick={handleProductClick}
          onProductSelect={handleProductSelect}
          selectedProducts={selectedProducts}
          searchQuery={searchQuery}
          categoryFilter={categoryFilter}
          stockFilter={stockFilter}
        />
      )}
    </div>
  );
};

export default memo(Products);
