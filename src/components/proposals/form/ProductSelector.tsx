import React, { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { logger } from '@/utils/logger';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, Loader2, Package, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/types/product";
import { formatCurrency } from "@/utils/formatters";
import { useDebounce } from "@/hooks/useDebounce";

interface ProductSelectorProps {
  value: string;
  onChange: (productName: string, product?: Product) => void;
  onProductSelect?: (product: Product) => void;
  onNewProduct?: (searchTerm?: string) => void;
  placeholder?: string;
  className?: string;
}

const PAGE_SIZE = 20;

const ProductSelector = ({ value, onChange, onProductSelect, onNewProduct, placeholder = "Ürün seçin...", className }: ProductSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);
  const listRef = useRef<HTMLDivElement>(null);

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

  // Infinite scroll ile ürünleri çek
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery({
    queryKey: ["products-infinite", companyId, debouncedSearch],
    queryFn: async ({ pageParam = 0 }) => {
      if (!companyId) {
        return { products: [], nextPage: null, totalCount: 0 };
      }

      const from = pageParam * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
        .from("products")
        .select("*", { count: "exact" })
        .eq("is_active", true)
        
        .order("name")
        .range(from, to);

      // Server-side arama
      if (debouncedSearch.trim()) {
        const searchTerm = `%${debouncedSearch.trim()}%`;
        query = query.or(`name.ilike.${searchTerm},description.ilike.${searchTerm},sku.ilike.${searchTerm}`);
      }

      const { data: productsData, error, count } = await query;
      
      if (error) throw error;

      if (!productsData || productsData.length === 0) {
        return { products: [], nextPage: null, totalCount: count || 0 };
      }

      // Stok bilgilerini çek
      const productIds = productsData.map(p => p.id);
      let stockMap = new Map<string, number>();

      if (productIds.length > 0) {
        try {
          const { data: stockData } = await supabase
            .from("warehouse_stock")
            .select("product_id, quantity")
            .in("product_id", productIds)
            ;

          if (stockData) {
            stockData.forEach((stock: { product_id: string; quantity: number }) => {
              const current = stockMap.get(stock.product_id) || 0;
              stockMap.set(stock.product_id, current + Number(stock.quantity || 0));
            });
          }
        } catch (stockError) {
          logger.warn("Stok bilgisi alınamadı:", stockError);
        }
      }

      // Ürünleri stok bilgisiyle birleştir
      const productsWithStock = productsData.map(product => ({
        ...product,
        stock_quantity: stockMap.get(product.id) || 0
      })) as Product[];

      const hasMore = (count || 0) > from + productsData.length;

      return {
        products: productsWithStock,
        nextPage: hasMore ? pageParam + 1 : null,
        totalCount: count || 0
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
    enabled: !!companyId && open,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });

  // Tüm sayfalardan ürünleri birleştir
  const allProductsRaw = data?.pages.flatMap(page => page.products) || [];
  const totalCount = data?.pages[0]?.totalCount || 0;

  // Seçili ürünü en üste taşı
  const allProducts = useMemo(() => {
    if (!value || allProductsRaw.length === 0) {
      return allProductsRaw;
    }
    
    const selectedIndex = allProductsRaw.findIndex(p => p.name === value);
    if (selectedIndex === -1) {
      return allProductsRaw;
    }
    
    const selectedProduct = allProductsRaw[selectedIndex];
    const otherProducts = allProductsRaw.filter((_, index) => index !== selectedIndex);
    
    return [selectedProduct, ...otherProducts];
  }, [allProductsRaw, value]);

  // Scroll event handler - infinite scroll için
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const { scrollTop, scrollHeight, clientHeight } = target;
    
    // Scroll'un %80'ine geldiğinde yeni sayfa yükle
    if (scrollHeight - scrollTop <= clientHeight * 1.2) {
      if (hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleSelect = (product: Product) => {
    if (onProductSelect) {
      onProductSelect(product);
    } else {
      onChange(product.name, product);
    }
    setOpen(false);
  };

  // Karakter sınırlaması için utility fonksiyonu
  const truncateText = (text: string, maxLength: number) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Popover açıldığında arama alanını temizle
  useEffect(() => {
    if (!open) {
      setSearchQuery("");
    }
  }, [open]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between mt-0.5 h-8 text-xs min-w-0",
            !value && "text-muted-foreground",
            className
          )}
        >
          <div className="flex items-center min-w-0 flex-1">
            <Package className="mr-1.5 h-3 w-3 shrink-0 opacity-50" />
            <span className="truncate text-left min-w-0 flex-1" title={value || placeholder}>
              {value || placeholder}
            </span>
          </div>
          <Search className="ml-1.5 h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[550px] max-w-[90vw] p-0 z-[9999] pointer-events-auto" 
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <div className="p-1.5 border-b">
          <Input
            placeholder="Ürün ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-8 text-xs"
            autoFocus
          />
        </div>
        <div 
          ref={listRef}
          className="h-[200px] overflow-y-auto"
          onScroll={handleScroll}
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-3 w-3 animate-spin text-primary" />
              <span className="ml-2 text-xs">Ürünler yükleniyor...</span>
            </div>
          ) : isError ? (
            <div className="p-3 text-center text-destructive text-xs">
              Ürünler yüklenirken bir hata oluştu.
            </div>
          ) : allProducts.length === 0 ? (
            <div className="p-3 text-center text-muted-foreground text-xs">
              {debouncedSearch ? `"${debouncedSearch}" ile eşleşen ürün bulunamadı` : "Henüz ürün bulunmuyor."}
            </div>
          ) : (
            <>
              {/* Toplam sonuç bilgisi */}
              {totalCount > 0 && (
                <div className="px-2 py-1 text-[10px] text-muted-foreground border-b bg-gray-50/50">
                  {totalCount} ürün bulundu
                </div>
              )}
              
              <div className="grid gap-0.5 p-1">
                {allProducts.map((product) => (
                  <div
                    key={product.id}
                    className={cn(
                      "flex items-start py-1 px-1.5 cursor-pointer rounded-md hover:bg-muted/50",
                      value === product.name && "bg-muted"
                    )}
                    onClick={() => handleSelect(product)}
                    title={`${product.name}${product.description ? `\n${product.description}` : ''}${product.sku ? `\nSKU: ${product.sku}` : ''}`}
                  >
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary mr-1.5 mt-0.5 text-[10px] font-medium">
                      {(product.name || 'Ü').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <p className="font-medium truncate text-xs" title={product.name}>
                          {truncateText(product.name, 60)}
                        </p>
                        {product.sku && (
                          <span className="text-[9px] text-muted-foreground font-mono truncate max-w-[140px] shrink-0 ml-2" title={product.sku}>
                            {truncateText(product.sku, 20)}
                          </span>
                        )}
                      </div>
                      {product.description && (
                        <p className="text-[11px] text-muted-foreground truncate" title={product.description}>
                          {truncateText(product.description, 70)}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                        <span className="font-semibold text-primary">
                          {formatCurrency(product.price, product.currency || 'TRY')}
                        </span>
                        <span>•</span>
                        <span>
                          Stok: {product.stock_quantity} {product.unit}
                        </span>
                        {product.category_type && (
                          <>
                            <span>•</span>
                            <span className="bg-gray-50 px-1 py-0.5 rounded">
                              {product.category_type}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Loading more indicator */}
              {isFetchingNextPage && (
                <div className="flex items-center justify-center py-2">
                  <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                  <span className="ml-1.5 text-[10px] text-muted-foreground">Daha fazla yükleniyor...</span>
                </div>
              )}
              
              {/* End of list indicator */}
              {!hasNextPage && allProducts.length > 0 && !isFetchingNextPage && (
                <div className="text-center py-1.5 text-[10px] text-muted-foreground">
                  {allProducts.length} ürün gösteriliyor
                </div>
              )}
            </>
          )}
          
          {/* Yeni Ürün Oluştur Butonu - Her zaman göster */}
          {onNewProduct && (
            <div className="border-t border-border mt-1">
              <div
                onClick={() => {
                  onNewProduct(debouncedSearch.trim() || undefined);
                  setOpen(false);
                }}
                className="flex items-center gap-2 py-2 px-3 cursor-pointer hover:bg-muted/50 rounded-sm transition-colors"
              >
                <Plus size={16} className="text-primary" />
                <span className="text-sm font-medium text-primary">Yeni ürün oluştur</span>
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ProductSelector;
