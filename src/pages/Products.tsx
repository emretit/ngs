import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import DefaultLayout from "@/components/layouts/DefaultLayout";
import ProductListHeader from "@/components/products/ProductListHeader";
import ProductListFilters from "@/components/products/ProductListFilters";
import ProductListTable from "@/components/products/ProductListTable";
import ProductGrid from "@/components/products/ProductGrid";
import ProductImportDialog from "@/components/products/excel/ProductImportDialog";
import { exportProductsToExcel, exportProductTemplateToExcel } from "@/utils/excelUtils";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";

import { Product } from "@/types/product";

const Products = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeView, setActiveView] = useState<"grid" | "table">("table");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [sortField, setSortField] = useState<"name" | "price" | "stock_quantity" | "category">("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const pageSize = 20;


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

  // Use infinite scroll for products
  const {
    data: products,
    isLoading,
    isLoadingMore,
    hasNextPage,
    error,
    loadMore,
    refresh,
    totalCount
  } = useInfiniteScroll<Product>(
    ['products', searchQuery, categoryFilter, stockFilter, sortField, sortDirection],
    async (page: number, size: number) => {
      let query = supabase
        .from("products")
        .select(`
          *,
          product_categories (
            id,
            name
          )
        `, { count: 'exact' });

      // Apply filters
      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,sku.ilike.%${searchQuery}%`);
      }

      if (categoryFilter && categoryFilter !== "all") {
        query = query.eq("category_id", categoryFilter);
      }

      if (stockFilter !== "all") {
        switch (stockFilter) {
          case "out_of_stock":
            query = query.eq("stock_quantity", 0);
            break;
          case "low_stock":
            query = query.gt("stock_quantity", 0).lte("stock_quantity", 5);
            break;
          case "in_stock":
            query = query.gt("stock_quantity", 5);
            break;
        }
      }


      // Apply sorting
      const orderField = sortField === "category" ? "product_categories(name)" : sortField;
      query = query.order(orderField, { ascending: sortDirection === "asc" });

      // Apply pagination
      const from = (page - 1) * size;
      const to = from + size - 1;

      const { data, error, count } = await query.range(from, to);

      if (error) throw error;

      return {
        data: data || [],
        totalCount: count || 0,
        hasNextPage: data && data.length === size
      };
    },
    { pageSize }
  );

  const handleSort = (field: "name" | "price" | "stock_quantity" | "category") => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection(field === "price" || field === "stock_quantity" ? "desc" : "asc");
    }
  };

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    // Navigate to product detail page
    navigate(`/products/${product.id}`);
  };

  const handleProductSelect = (product: Product) => {
    setSelectedProducts(prev => {
      const isSelected = prev.some(p => p.id === product.id);
      return isSelected
        ? prev.filter(p => p.id !== product.id)
        : [...prev, product];
    });
  };

  const handleClearSelection = () => {
    setSelectedProducts([]);
  };

  const handleBulkAction = async (action: string) => {
    console.log('Bulk action:', action, selectedProducts);
    // Implement bulk actions here
  };

  const handleImportSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['products'] });
    refresh();
  };

  const handleDownloadTemplate = () => {
    exportProductTemplateToExcel();
  };

  const handleExportExcel = () => {
    exportProductsToExcel(products as any);
  };

  const handleImportExcel = () => {
    setIsImportDialogOpen(true);
  };

  // Flatten products for display
  const flatProducts = products || [];

  // Group products by status for header stats
  const groupedProducts = {
    all: flatProducts,
    in_stock: flatProducts.filter(p => p.stock_quantity > 5),
    low_stock: flatProducts.filter(p => p.stock_quantity > 0 && p.stock_quantity <= 5),
    out_of_stock: flatProducts.filter(p => p.stock_quantity === 0),
    active: flatProducts.filter(p => p.is_active),
    inactive: flatProducts.filter(p => !p.is_active),
  };

  return (
    <DefaultLayout>
      <div className="space-y-2">
        {/* Header */}
        <ProductListHeader
          activeView={activeView}
          setActiveView={setActiveView}
          products={groupedProducts}
          totalProducts={totalCount || 0}
          onDownloadTemplate={handleDownloadTemplate}
          onExportExcel={handleExportExcel}
          onImportExcel={handleImportExcel}
          onBulkAction={handleBulkAction}
        />

        {/* Filters */}
        <ProductListFilters
          search={searchQuery}
          setSearch={setSearchQuery}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          stockFilter={stockFilter}
          setStockFilter={setStockFilter}
          categories={categories}
        />

        {/* Bulk Actions */}
        {selectedProducts.length > 0 && (
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium">
                {selectedProducts.length} ürün seçildi
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleBulkAction('activate')}
                  className="text-sm px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                >
                  Aktifleştir
                </button>
                <button
                  onClick={() => handleBulkAction('deactivate')}
                  className="text-sm px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                >
                  Pasifleştir
                </button>
                <button
                  onClick={() => handleBulkAction('update_category')}
                  className="text-sm px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                >
                  Kategori Güncelle
                </button>
              </div>
            </div>
            <button
              onClick={handleClearSelection}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Seçimi Temizle
            </button>
          </div>
        )}

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
          <Tabs value={activeView} className="w-full">
            <TabsContent value="grid" className="mt-0">
              <ProductGrid
                products={flatProducts}
                isLoading={isLoading}
                isLoadingMore={isLoadingMore}
                hasNextPage={hasNextPage}
                loadMore={loadMore}
                onProductClick={handleProductClick}
                onProductSelect={handleProductSelect}
                selectedProducts={selectedProducts}
              />
            </TabsContent>
            <TabsContent value="table" className="mt-0">
              <ProductListTable
                products={flatProducts}
                isLoading={isLoading}
                isLoadingMore={isLoadingMore}
                hasNextPage={hasNextPage}
                loadMore={loadMore}
                totalCount={totalCount || 0}
                sortField={sortField}
                sortDirection={sortDirection}
                onSortFieldChange={handleSort}
                onProductClick={handleProductClick}
                onProductSelect={handleProductSelect}
                selectedProducts={selectedProducts}
              />
            </TabsContent>
          </Tabs>
        )}
      </div>

      <ProductImportDialog
        isOpen={isImportDialogOpen}
        setIsOpen={setIsImportDialogOpen}
        onImportSuccess={handleImportSuccess}
      />
    </DefaultLayout>
  );
};

export default Products;