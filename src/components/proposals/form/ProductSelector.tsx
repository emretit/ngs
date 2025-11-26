import React, { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown, Plus, Loader2 } from "lucide-react";
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
  onNewProduct?: () => void;
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
        .eq("company_id", companyId)
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
            .eq("company_id", companyId);

          if (stockData) {
            stockData.forEach((stock: { product_id: string; quantity: number }) => {
              const current = stockMap.get(stock.product_id) || 0;
              stockMap.set(stock.product_id, current + Number(stock.quantity || 0));
            });
          }
        } catch (stockError) {
          console.warn("Stok bilgisi alınamadı:", stockError);
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
  const allProducts = data?.pages.flatMap(page => page.products) || [];
  const totalCount = data?.pages[0]?.totalCount || 0;

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
            "w-full justify-between min-w-0 bg-background border-border hover:border-primary hover:bg-background transition-colors duration-200 focus:border-primary focus:ring-0",
            !value && "text-muted-foreground",
            className
          )}
          style={{
            borderColor: 'hsl(var(--border))',
            backgroundColor: 'hsl(var(--background))'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'hsl(var(--primary))';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'hsl(var(--border))';
          }}
        >
          <span className="truncate text-left flex-1 min-w-0" title={value || placeholder}>
            {value || <span className="text-muted-foreground">{placeholder}</span>}
          </span>
          <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[550px] p-0 z-[100]" align="start">
        <Command shouldFilter={false} className="rounded-lg border shadow-md">
          <CommandInput 
            placeholder="Ürün ara..." 
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList 
            ref={listRef}
            className="max-h-[400px] overflow-y-auto"
            onScroll={handleScroll}
          >
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Ürünler yükleniyor...</span>
              </div>
            ) : isError ? (
              <div className="py-6 text-center text-sm text-destructive">
                Ürünler yüklenirken bir hata oluştu.
              </div>
            ) : allProducts.length === 0 ? (
              <CommandEmpty className="py-6 text-center text-sm">
                {debouncedSearch ? "Aramanızla eşleşen ürün bulunamadı." : "Henüz ürün bulunmuyor."}
              </CommandEmpty>
            ) : (
              <CommandGroup>
                {/* Toplam sonuç bilgisi */}
                {totalCount > 0 && (
                  <div className="px-2 py-1 text-[10px] text-muted-foreground border-b bg-gray-50/50">
                    {totalCount} ürün bulundu
                  </div>
                )}
                
                {allProducts.map((product) => (
                  <CommandItem
                    key={product.id}
                    value={product.name}
                    onSelect={() => handleSelect(product)}
                    className="flex items-start gap-1.5 px-2 py-1.5 cursor-pointer hover:bg-muted/50 data-[selected=true]:bg-accent/10 data-[selected=true]:text-accent-foreground rounded-sm transition-colors"
                    title={`${product.name}${product.description ? `\n${product.description}` : ''}${product.sku ? `\nSKU: ${product.sku}` : ''}`}
                  >
                    <Check
                      className={cn(
                        "h-3 w-3 shrink-0 mt-0.5",
                        value === product.name ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                      {/* Üst satır: Ürün İsmi + SKU (sağ üst) */}
                      <div className="flex items-start justify-between gap-2">
                        <span 
                          className="font-medium text-foreground text-xs leading-tight truncate"
                          title={product.name}
                        >
                          {product.name}
                        </span>
                        {product.sku && (
                          <span 
                            className="text-[9px] text-muted-foreground font-mono truncate max-w-[140px] shrink-0"
                            title={product.sku}
                          >
                            {product.sku}
                          </span>
                        )}
                      </div>
                      
                      {/* Alt satır: Fiyat, Stok + Kategori */}
                      <div className="flex items-center justify-between gap-2 text-[10px]">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-primary">
                            {formatCurrency(product.price, product.currency === 'TRY' ? 'TL' : (product.currency || 'TL'))}
                          </span>
                          <span className="text-muted-foreground">
                            Stok: {product.stock_quantity} {product.unit}
                          </span>
                        </div>
                        {product.category_type && (
                          <span className="text-[9px] text-muted-foreground bg-gray-50 px-1 py-0.5 rounded whitespace-nowrap shrink-0">
                            {product.category_type}
                          </span>
                        )}
                      </div>
                    </div>
                  </CommandItem>
                ))}
                
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
              </CommandGroup>
            )}
            
            {/* Yeni Ürün Oluştur Butonu - Ayrı CommandGroup */}
            {onNewProduct && (
              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    onNewProduct();
                    setOpen(false);
                  }}
                  className="flex items-start gap-3 p-3 cursor-pointer hover:bg-muted/50 data-[selected=true]:bg-accent/10 data-[selected=true]:text-accent-foreground rounded-sm transition-colors border-t border-border mt-1"
                >
                  <div className="flex items-center gap-2">
                    <Plus size={16} className="text-primary" />
                    <span className="text-sm font-medium text-primary">Yeni ürün oluştur</span>
                  </div>
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default ProductSelector;
