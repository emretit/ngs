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
import { ConfirmationDialogComponent } from "@/components/ui/confirmation-dialog";
import { useTranslation } from "react-i18next";

const Products = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeView, setActiveView] = useState<"grid" | "table">("table");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [warehouseFilter, setWarehouseFilter] = useState("all");
  
  // Debounced search query
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [sortField, setSortField] = useState<"name" | "price" | "stock_quantity" | "category">("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  // Önce company_id'yi al
  const { data: userProfile } = useQuery({
    queryKey: ["user_profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      return profile;
    },
  });

  const companyId = userProfile?.company_id;

  // Tüm ürünler için istatistikleri çek (filtre olmadan, sadece company_id'ye göre)
  const { data: productStatistics } = useQuery({
    queryKey: ["product_statistics", companyId],
    queryFn: async () => {
      if (!companyId) {
        return {
          totalCount: 0,
          inStockCount: 0,
          lowStockCount: 0,
          outOfStockCount: 0,
          activeCount: 0,
          inactiveCount: 0
        };
      }

      // Toplam ürün sayısını count ile al (limit sorunu olmasın diye)
      const { count: totalCount, error: countError } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("company_id", companyId);

      if (countError) {
        console.error("Error counting products for statistics:", countError);
        throw countError;
      }

      if (!totalCount || totalCount === 0) {
        return {
          totalCount: 0,
          inStockCount: 0,
          lowStockCount: 0,
          outOfStockCount: 0,
          activeCount: 0,
          inactiveCount: 0
        };
      }

      // Aktif/Pasif sayılarını ayrı count query'leri ile al
      const { count: activeCount, error: activeError } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("company_id", companyId)
        .eq("is_active", true);

      if (activeError) {
        console.error("Error counting active products:", activeError);
      }

      const inactiveCount = (totalCount || 0) - (activeCount || 0);

      // Warehouse stock verilerini çek - tüm ürünler için stok toplamlarını al
      // Önce tüm product_id'leri çek (sadece id'leri, pagination ile limit sorununu çöz)
      let allProductIds: { id: string }[] = [];
      let page = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data: pageData, error: productIdsError } = await supabase
          .from("products")
          .select("id")
          .eq("company_id", companyId)
          .range(page * pageSize, (page + 1) * pageSize - 1);

        if (productIdsError) {
          console.error("Error fetching product IDs for stock statistics:", productIdsError);
          hasMore = false;
          break;
        }

        if (pageData && pageData.length > 0) {
          allProductIds = [...allProductIds, ...pageData];
          hasMore = pageData.length === pageSize;
          page++;
        } else {
          hasMore = false;
        }
      }

      // Stok sayılarını hesapla
      let inStockCount = 0;
      let lowStockCount = 0;
      let outOfStockCount = 0;

      if (allProductIds && allProductIds.length > 0) {
        const productIds = allProductIds.map(p => p.id);
        
        // Warehouse stock verilerini batch'ler halinde çek (URL çok uzun olmasın diye)
        // Her batch'te maksimum 100 ürün ID'si kullan
        const batchSize = 100;
        const stockMap = new Map<string, number>();
        const totalBatches = Math.ceil(productIds.length / batchSize);

        for (let i = 0; i < totalBatches; i++) {
          const start = i * batchSize;
          const end = Math.min(start + batchSize, productIds.length);
          const batchIds = productIds.slice(start, end);

          try {
            const { data: batchStockData, error: batchStockError } = await supabase
              .from("warehouse_stock")
              .select("product_id, quantity")
              .in("product_id", batchIds)
              .eq("company_id", companyId);

            if (batchStockError) {
              console.error(`Error fetching warehouse stock batch ${i + 1}/${totalBatches}:`, batchStockError);
              // Batch hatası olsa bile devam et
              continue;
            }

            // Stok verilerini grupla (her ürün için toplam stok miktarı)
            if (batchStockData) {
              batchStockData.forEach((stock: { product_id: string; quantity: number }) => {
                const current = stockMap.get(stock.product_id) || 0;
                stockMap.set(stock.product_id, current + Number(stock.quantity || 0));
              });
            }
          } catch (error) {
            console.error(`Error in warehouse stock batch ${i + 1}/${totalBatches}:`, error);
            // Hata olsa bile devam et
          }
        }

        // Her ürün için stok durumunu kontrol et
        allProductIds.forEach(product => {
          const stockQuantity = stockMap.get(product.id) || 0;
          if (stockQuantity > 5) {
            inStockCount++;
          } else if (stockQuantity > 0 && stockQuantity <= 5) {
            lowStockCount++;
          } else {
            outOfStockCount++;
          }
        });
      } else {
        // Ürün ID'leri alınamadıysa, tüm ürünler tükendi olarak sayılır
        outOfStockCount = totalCount || 0;
      }

      return {
        totalCount: totalCount || 0,
        inStockCount,
        lowStockCount,
        outOfStockCount,
        activeCount: activeCount || 0,
        inactiveCount
      };
    },
    enabled: !!companyId, // companyId yoksa query çalışmasın
    staleTime: 5 * 60 * 1000, // 5 dakika
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
      toast.error(t("pages.products.loadError"), { duration: 1000 });
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

  const handleSelectAllProducts = useCallback(async (checked: boolean) => {
    if (!checked) {
      // Tüm seçimleri temizle
      setSelectedProducts([]);
      return;
    }

    // Tüm ürünleri seçmek için backend'den tüm ürünleri çek
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user?.id)
        .single();

      const companyId = profile?.company_id;

      let query = supabase
        .from("products")
        .select(`
          *,
          product_categories (
            id,
            name
          )
        `);

      // Apply search filter
      if (debouncedSearchQuery) {
        query = query.or(`name.ilike.%${debouncedSearchQuery}%,sku.ilike.%${debouncedSearchQuery}%`);
      }

      // Apply category filter
      if (categoryFilter && categoryFilter !== "all") {
        query = query.eq("category_id", categoryFilter);
      }

      // Apply company filter
      if (companyId) {
        query = query.eq("company_id", companyId);
      }

      // Stok filtrelemesi varsa, warehouse_stock ile birleştir
      if (stockFilter && stockFilter !== "all") {
        // Önce tüm ürünleri çek
        const { data: allProducts, error: productsError } = await query;

        if (productsError) throw productsError;
        if (!allProducts || allProducts.length === 0) {
          setSelectedProducts([]);
          return;
        }

        // Warehouse stock verilerini çek
        const productIds = allProducts.map(p => p.id);
        let stockQuery = supabase
          .from("warehouse_stock")
          .select("product_id, quantity")
          .in("product_id", productIds);

        if (companyId) {
          stockQuery = stockQuery.eq("company_id", companyId);
        }

        const { data: stockData } = await stockQuery;

        // Stok verilerini grupla
        const stockMap = new Map<string, number>();
        if (stockData) {
          stockData.forEach((stock: { product_id: string; quantity: number }) => {
            const current = stockMap.get(stock.product_id) || 0;
            stockMap.set(stock.product_id, current + Number(stock.quantity || 0));
          });
        }

        // Ürünleri stok bilgisiyle güncelle ve filtrele
        let filteredProducts = allProducts.map(product => ({
          ...product,
          stock_quantity: stockMap.get(product.id) || 0
        }));

        if (stockFilter === "in_stock") {
          filteredProducts = filteredProducts.filter(p => p.stock_quantity > 0);
        } else if (stockFilter === "out_of_stock") {
          filteredProducts = filteredProducts.filter(p => p.stock_quantity === 0);
        } else if (stockFilter === "low_stock") {
          filteredProducts = filteredProducts.filter(p => p.stock_quantity > 0 && p.stock_quantity <= (p.min_stock_level || 0));
        }

        setSelectedProducts(filteredProducts as Product[]);
      } else {
        // Stok filtrelemesi yoksa direkt çek
        const { data: allProducts, error: productsError } = await query;

        if (productsError) throw productsError;
        if (!allProducts || allProducts.length === 0) {
          setSelectedProducts([]);
          return;
        }

        setSelectedProducts(allProducts as Product[]);
      }
    } catch (error) {
      console.error('Error selecting all products:', error);
        toast.error(t("pages.products.selectAllError"), { duration: 1000 });
    }
  }, [debouncedSearchQuery, categoryFilter, stockFilter]);

  const handleClearSelection = useCallback(() => {
    setSelectedProducts([]);
  }, []);

  const handleBulkAction = useCallback(async (action: string) => {
    if (action === 'export') {
      exportProductsToExcel(selectedProducts);
    } else if (action === 'delete') {
      if (selectedProducts.length === 0) {
        toast.error('Lütfen silmek için en az bir ürün seçin', { duration: 1000 });
        return;
      }
      setIsDeleteDialogOpen(true);
    } else if (action === 'activate') {
      try {
        const productIds = selectedProducts.map(p => p.id);
        const { error } = await supabase
          .from('products')
          .update({ is_active: true, status: 'active' })
          .in('id', productIds);

        if (error) throw error;

        toast.success(t("pages.products.activated", { count: selectedProducts.length }), { duration: 1000 });
        queryClient.invalidateQueries({ queryKey: ['products'] });
        queryClient.invalidateQueries({ queryKey: ['product_statistics', companyId] });
        refresh();
        setSelectedProducts([]);
      } catch (error) {
        console.error('Error activating products:', error);
        toast.error(t("pages.products.activateError"), { duration: 1000 });
      }
    } else if (action === 'deactivate') {
      try {
        const productIds = selectedProducts.map(p => p.id);
        const { error } = await supabase
          .from('products')
          .update({ is_active: false, status: 'inactive' })
          .in('id', productIds);

        if (error) throw error;

        toast.success(t("pages.products.deactivated", { count: selectedProducts.length }), { duration: 1000 });
        queryClient.invalidateQueries({ queryKey: ['products'] });
        queryClient.invalidateQueries({ queryKey: ['product_statistics', companyId] });
        refresh();
        setSelectedProducts([]);
      } catch (error) {
        console.error('Error deactivating products:', error);
        toast.error(t("pages.products.deactivateError"), { duration: 1000 });
      }
    }
  }, [selectedProducts, queryClient, refresh, companyId]);

  const handleImportSuccess = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['products'] });
    queryClient.invalidateQueries({ queryKey: ['product_statistics', companyId] });
    refresh();
  }, [queryClient, refresh, companyId]);

  const handleBulkDeleteConfirm = useCallback(async () => {
    if (selectedProducts.length === 0) return;

    setIsDeleting(true);
    try {
      const productIds = selectedProducts.map(p => p.id);
      
      // Önce hangi ürünlerin referansları olduğunu kontrol et
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('product_id')
        .in('product_id', productIds)
        .limit(1);
      
      const { data: salesInvoiceItems } = await supabase
        .from('sales_invoice_items')
        .select('product_id')
        .in('product_id', productIds)
        .limit(1);
      
      const { data: purchaseInvoiceItems } = await supabase
        .from('purchase_invoice_items')
        .select('product_id')
        .in('product_id', productIds)
        .limit(1);
      
      const { data: eFaturaStokEslestirme } = await supabase
        .from('e_fatura_stok_eslestirme')
        .select('matched_stock_id')
        .in('matched_stock_id', productIds)
        .limit(1);
      
      const { data: warehouseStock } = await supabase
        .from('warehouse_stock')
        .select('product_id')
        .in('product_id', productIds)
        .limit(1);

      if (orderItems && orderItems.length > 0) {
        toast.error(t("pages.products.cannotDeleteOrders"), { duration: 1000 });
        return;
      }

      if (salesInvoiceItems && salesInvoiceItems.length > 0) {
        toast.error(t("pages.products.cannotDeleteInvoices"), { duration: 1000 });
        return;
      }

      // Purchase invoice items'ı önce sil
      if (purchaseInvoiceItems && purchaseInvoiceItems.length > 0) {
        const { error: purchaseInvoiceError } = await supabase
          .from('purchase_invoice_items')
          .delete()
          .in('product_id', productIds);

        if (purchaseInvoiceError) {
          console.error('Error deleting purchase_invoice_items:', purchaseInvoiceError);
          toast.error('Alış fatura kalemleri silinirken bir hata oluştu', { duration: 1000 });
          return;
        }
      }

      // E-fatura stok eşleştirmelerini önce sil
      if (eFaturaStokEslestirme && eFaturaStokEslestirme.length > 0) {
        const { error: eFaturaError } = await supabase
          .from('e_fatura_stok_eslestirme')
          .delete()
          .in('matched_stock_id', productIds);

        if (eFaturaError) {
          console.error('Error deleting e_fatura_stok_eslestirme:', eFaturaError);
          toast.error('E-fatura stok eşleştirmeleri silinirken bir hata oluştu', { duration: 1000 });
          return;
        }
      }

      // Warehouse stock'u önce sil
      if (warehouseStock && warehouseStock.length > 0) {
        const { error: stockError } = await supabase
          .from('warehouse_stock')
          .delete()
          .in('product_id', productIds);

        if (stockError) {
          console.error('Error deleting warehouse stock:', stockError);
          toast.error('Stok kayıtları silinirken bir hata oluştu', { duration: 1000 });
          return;
        }
      }

      const { error, status, statusText } = await supabase
        .from('products')
        .delete()
        .in('id', productIds);

      if (error) {
        // 409 Conflict veya foreign key constraint hatası için özel mesaj
        const httpStatus = (error as any)?.status || status;
        const isConflictError = 
          httpStatus === 409 || 
          error.code === '23503' || 
          error.code === 'PGRST204' ||
          error.code === '409' ||
          error.message?.includes('foreign key') ||
          error.message?.includes('violates foreign key constraint') ||
          error.message?.includes('still referenced') ||
          error.message?.includes('conflict') ||
          statusText === 'Conflict';

        if (isConflictError) {
          toast.error(t("pages.products.cannotDeleteInUse"), { duration: 1000 });
          console.error('Delete conflict error:', { error, status, statusText, httpStatus, productIds });
        } else {
          console.error('Delete error:', { error, status, statusText, httpStatus, productIds });
          throw error;
        }
        return;
      }

        toast.success(t("pages.products.deleted", { count: selectedProducts.length }), { duration: 1000 });
      // Tüm products query'lerini invalidate et (tüm sayfalar dahil)
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product_statistics', companyId] });
      // Infinite scroll state'ini sıfırla
      refresh();
      setSelectedProducts([]);
    } catch (error: any) {
      console.error('Error deleting products:', error);
      
      // 409 Conflict veya foreign key constraint hatası kontrolü
      const isConflictError = 
        error?.status === 409 ||
        error?.code === '23503' || 
        error?.code === 'PGRST204' ||
        error?.message?.includes('foreign key') ||
        error?.message?.includes('violates foreign key constraint') ||
        error?.message?.includes('still referenced');

      if (isConflictError) {
        toast.error(t("pages.products.cannotDeleteInUse"), { duration: 1000 });
      } else {
        toast.error(`${t("pages.products.deleteError")}: ${error?.message || t("common.unknownError")}`, { duration: 1000 });
      }
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  }, [selectedProducts, queryClient, refresh, companyId]);

  const handleBulkDeleteCancel = useCallback(() => {
    setIsDeleteDialogOpen(false);
  }, []);

  return (
    <div className="space-y-2">
      {/* Header */}
      <ProductsHeader 
        products={products || []}
        activeView={activeView}
        setActiveView={setActiveView}
        totalCount={totalCount}
        statistics={productStatistics}
      />
      
      {/* Filters */}
      <ProductsFilterBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        stockFilter={stockFilter}
        setStockFilter={setStockFilter}
        warehouseFilter={warehouseFilter}
        setWarehouseFilter={setWarehouseFilter}
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
            <p className="text-muted-foreground">{t("pages.products.loading")}</p>
          </div>
        </div>
      ) : error ? (
        <div className="h-96 flex items-center justify-center">
          <div className="text-red-500">{t("pages.products.loadError")}</div>
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
          onSelectAll={handleSelectAllProducts}
          selectedProducts={selectedProducts}
          searchQuery={searchQuery}
          categoryFilter={categoryFilter}
          stockFilter={stockFilter}
        />
      )}

      {/* Bulk Delete Confirmation Dialog */}
      <ConfirmationDialogComponent
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title={t("pages.products.deleteTitle")}
        description={`Seçili ${selectedProducts.length} ürünü silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`}
        confirmText={t("common.delete")}
        cancelText={t("common.cancel")}
        variant="destructive"
        onConfirm={handleBulkDeleteConfirm}
        onCancel={handleBulkDeleteCancel}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default memo(Products);
