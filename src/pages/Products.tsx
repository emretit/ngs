
import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, LayoutGrid, Table as TableIcon, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ProductListHeader from "@/components/products/ProductListHeader";
import ProductListFilters from "@/components/products/ProductListFilters";
import ProductListTable from "@/components/products/ProductListTable";
import ProductGrid from "@/components/products/ProductGrid";
import ProductImportDialog from "@/components/products/excel/ProductImportDialog";
import { exportProductsToExcel, exportProductTemplateToExcel } from "@/utils/excelUtils";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { TopBar } from "@/components/TopBar";
import InfiniteScroll from "@/components/ui/infinite-scroll";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

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
  const [sortField, setSortField] = useState<"name" | "price" | "stock_quantity" | "category">("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

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

  const { data: products, isLoading } = useQuery({
    queryKey: ['products', searchQuery, categoryFilter, stockFilter],
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select(`
          *,
          product_categories (
            id,
            name
          )
        `);

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

      const { data, error } = await query
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    }
  });

  // Filtreleme ve sıralama
  const filteredProducts = products?.filter(product => {
    const matchesSearch = !searchQuery || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = !categoryFilter || categoryFilter === "all" || product.category_id === categoryFilter;
    
    let matchesStock = true;
    if (stockFilter !== "all") {
      switch (stockFilter) {
        case "out_of_stock":
          matchesStock = product.stock_quantity === 0;
          break;
        case "low_stock":
          matchesStock = product.stock_quantity > 0 && product.stock_quantity <= 5;
          break;
        case "in_stock":
          matchesStock = product.stock_quantity > 5;
          break;
      }
    }

    return matchesSearch && matchesCategory && matchesStock;
  });

  const allSortedProducts = filteredProducts?.sort((a, b) => {
    let valueA, valueB;
    
    // Determine values to compare based on sort field
    if (sortField === "name") {
      valueA = a.name.toLowerCase();
      valueB = b.name.toLowerCase();
    } else if (sortField === "category") {
      valueA = (a.product_categories?.name || '').toLowerCase();
      valueB = (b.product_categories?.name || '').toLowerCase();
    } else if (sortField === "price") {
      valueA = a.price;
      valueB = b.price;
    } else { // stock_quantity
      valueA = a.stock_quantity;
      valueB = b.stock_quantity;
    }
    
    // Compare values based on sort direction
    if (sortDirection === "asc") {
      return valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
    } else {
      return valueA > valueB ? -1 : valueA < valueB ? 1 : 0;
    }
  });

  // Pagination logic
  const totalPages = Math.ceil((allSortedProducts?.length || 0) / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const sortedProducts = allSortedProducts?.slice(startIndex, endIndex);

  const handleSort = (field: "name" | "price" | "stock_quantity" | "category") => {
    if (field === sortField) {
      // Toggle direction if same field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // New field, set direction based on field
      setSortField(field);
      // Text fields default to asc, numeric to desc
      setSortDirection(field === "price" || field === "stock_quantity" ? "desc" : "asc");
    }
  };

  const handleBulkAction = async (action: string) => {
    console.log('Bulk action:', action);
  };

  const handleImportSuccess = () => {
    // Refresh products list after successful import
    queryClient.invalidateQueries({ queryKey: ['products'] });
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex relative">
      <Navbar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <main
        className={`flex-1 transition-all duration-300 ${
          isCollapsed ? "ml-[60px]" : "ml-[60px] sm:ml-64"
        }`}
      >
        <TopBar />
        <div className="p-4 sm:p-8">
          <ProductListHeader 
            totalProducts={allSortedProducts?.length || 0}
            onDownloadTemplate={handleDownloadTemplate}
            onExportExcel={handleExportExcel}
            onImportExcel={handleImportExcel}
            onBulkAction={handleBulkAction}
          />
          
          <ProductListFilters 
            search={searchQuery}
            setSearch={setSearchQuery}
            categoryFilter={categoryFilter}
            setCategoryFilter={setCategoryFilter}
            stockFilter={stockFilter}
            setStockFilter={setStockFilter}
            categories={categories}
          />

          <div className="flex items-center justify-between mb-6">
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
          </div>

          {view === "grid" ? (
            <ProductGrid products={sortedProducts as any} isLoading={isLoading} />
          ) : (
            <ProductListTable 
              products={sortedProducts}
              isLoading={isLoading}
              sortField={sortField}
              sortDirection={sortDirection}
              onSortFieldChange={handleSort}
            />
          )}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-card rounded-lg border">
              <div className="text-sm text-muted-foreground">
                Toplam <span className="font-medium text-foreground">{allSortedProducts?.length || 0}</span> ürün, 
                <span className="font-medium text-foreground"> {startIndex + 1}-{Math.min(endIndex, allSortedProducts?.length || 0)}</span> arası gösteriliyor
              </div>
              <Pagination>
                <PaginationContent className="gap-1">
                  <PaginationItem>
                    <PaginationPrevious 
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 1) setCurrentPage(currentPage - 1);
                      }}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "hover:bg-accent"}
                    />
                  </PaginationItem>
                  
                  {/* Smart pagination with ellipsis */}
                  {(() => {
                    const pages = [];
                    const showPages = 5;
                    let startPage = Math.max(1, currentPage - Math.floor(showPages / 2));
                    const endPage = Math.min(totalPages, startPage + showPages - 1);
                    
                    if (endPage - startPage < showPages - 1) {
                      startPage = Math.max(1, endPage - showPages + 1);
                    }
                    
                    if (startPage > 1) {
                      pages.push(
                        <PaginationItem key={1}>
                          <PaginationLink
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              setCurrentPage(1);
                            }}
                            className="hover:bg-accent"
                          >
                            1
                          </PaginationLink>
                        </PaginationItem>
                      );
                      if (startPage > 2) {
                        pages.push(
                          <PaginationItem key="start-ellipsis">
                            <span className="px-3 py-2 text-muted-foreground">...</span>
                          </PaginationItem>
                        );
                      }
                    }
                    
                    for (let i = startPage; i <= endPage; i++) {
                      pages.push(
                        <PaginationItem key={i}>
                          <PaginationLink
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              setCurrentPage(i);
                            }}
                            isActive={currentPage === i}
                            className={currentPage === i ? "bg-primary text-primary-foreground" : "hover:bg-accent"}
                          >
                            {i}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    }
                    
                    if (endPage < totalPages) {
                      if (endPage < totalPages - 1) {
                        pages.push(
                          <PaginationItem key="end-ellipsis">
                            <span className="px-3 py-2 text-muted-foreground">...</span>
                          </PaginationItem>
                        );
                      }
                      pages.push(
                        <PaginationItem key={totalPages}>
                          <PaginationLink
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              setCurrentPage(totalPages);
                            }}
                            className="hover:bg-accent"
                          >
                            {totalPages}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    }
                    
                    return pages;
                  })()}
                  
                  <PaginationItem>
                    <PaginationNext 
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                      }}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "hover:bg-accent"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
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
