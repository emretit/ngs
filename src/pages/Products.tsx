
import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, LayoutGrid, Table as TableIcon, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ProductFilters from "@/components/products/ProductFilters";
import ProductGrid from "@/components/products/ProductGrid";
import ProductTable from "@/components/products/ProductTable";
import ProductImportDialog from "@/components/products/excel/ProductImportDialog";
import { exportProductsToExcel, exportProductTemplateToExcel } from "@/utils/excelUtils";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { TopBar } from "@/components/TopBar";
import InfiniteScroll from "@/components/ui/infinite-scroll";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";

interface ProductsProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

const Products = ({ isCollapsed, setIsCollapsed }: ProductsProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [view, setView] = useState<"grid" | "table">("table");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
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

  // Infinite scroll için query function
  const fetchProducts = useCallback(async (page: number, pageSize: number) => {
    let query = supabase
      .from("products")
      .select(`
        *,
        product_categories (
          id,
          name
        )
      `, { count: 'exact' });

    // Filtreleme uygula
    if (searchQuery) {
      query = query.ilike("name", `%${searchQuery}%`);
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

    // Range ile sayfa bazlı veri çek
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw error;

    return {
      data: data || [],
      totalCount: count || 0,
      hasNextPage: data ? data.length === pageSize : false,
    };
  }, [searchQuery, categoryFilter, stockFilter]);

  // Infinite scroll hook'u kullan
  const {
    data: products,
    isLoading,
    isLoadingMore,
    hasNextPage,
    error,
    loadMore,
    refresh,
    totalCount,
  } = useInfiniteScroll(
    ["products", searchQuery, categoryFilter, stockFilter],
    fetchProducts,
    {
      pageSize,
      enabled: true,
      staleTime: 5 * 60 * 1000, // 5 dakika
      gcTime: 10 * 60 * 1000, // 10 dakika
    }
  );

  const handleBulkAction = async (action: string) => {
    console.log('Bulk action:', action);
  };

  const handleImportSuccess = () => {
    // Refresh products list after successful import
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

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Navbar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <main className={`flex-1 transition-all duration-300 ${
        isCollapsed ? "ml-[60px]" : "ml-[60px] sm:ml-64"
      }`}>
        <TopBar />
        <div className="container mx-auto p-8 max-w-7xl">
                      <ProductFilters
              setSearchQuery={setSearchQuery}
              categoryFilter={categoryFilter}
              setCategoryFilter={setCategoryFilter}
              stockFilter={stockFilter}
              setStockFilter={setStockFilter}
              categories={categories}
              totalProducts={totalCount || 0}
              onBulkAction={handleBulkAction}
              onDownloadTemplate={handleDownloadTemplate}
              onExportExcel={handleExportExcel}
              onImportExcel={handleImportExcel}
            />

          <div className="flex items-center justify-between mt-6">
            <div className="flex items-center space-x-4">
              <div className="border rounded-lg p-1">
                <Button
                  variant={view === "grid" ? "default" : "ghost"}
                  size="icon"
                  onClick={() => setView("grid")}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={view === "table" ? "default" : "ghost"}
                  size="icon"
                  onClick={() => setView("table")}
                >
                  <TableIcon className="h-4 w-4" />
                </Button>
              </div>
              

            </div>

            <Button onClick={() => navigate("/product-form")} className="gap-2">
              <Plus className="h-4 w-4" />
              Yeni Ürün
            </Button>
          </div>

          {/* Infinite Scroll Content */}
          <InfiniteScroll
            hasNextPage={hasNextPage}
            isLoadingMore={isLoadingMore}
            onLoadMore={loadMore}
            error={error}
            onRetry={refresh}
            isEmpty={products.length === 0 && !isLoading}
            emptyState={
              <div className="flex flex-col items-center justify-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                  Ürün bulunamadı
                </h3>
                <p className="text-muted-foreground text-center">
                  Arama kriterlerinize uygun ürün bulunamadı.
                </p>
              </div>
            }
            className="mt-6 rounded-lg border bg-card"
          >
            {view === "grid" ? (
              <ProductGrid products={products as any} isLoading={isLoading} />
            ) : (
              <ProductTable products={products as any} isLoading={isLoading} />
            )}
          </InfiniteScroll>

          {/* Info Banner */}
          {totalCount && totalCount > 0 && (
            <div className="mt-4 text-center text-sm text-muted-foreground">
              Toplam <span className="font-medium text-foreground">{totalCount}</span> ürün,
              <span className="font-medium text-foreground"> {products.length}</span> adet yüklendi
            </div>
          )}
        </div>
      </main>
      
      <ProductImportDialog 
        isOpen={isImportDialogOpen}
        setIsOpen={setIsImportDialogOpen}
        onImportSuccess={handleImportSuccess}
      />
    </div>
  );
};

export default Products;
