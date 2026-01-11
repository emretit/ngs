import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown, Plus, Warehouse } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/types/product";
import { formatCurrency } from "@/utils/formatters";

interface EInvoiceProductSelectorProps {
  value: string;
  onChange: (productName: string, product?: Product) => void;
  onProductSelect?: (product: Product) => void;
  onNewProduct?: () => void;
  placeholder?: string;
  className?: string;
}

interface ProductWithWarehouses extends Product {
  warehouses?: Array<{
    warehouse_id: string;
    warehouse_name: string;
    warehouse_code?: string;
    quantity: number;
  }>;
  total_stock: number;
}

const EInvoiceProductSelector = ({ 
  value, 
  onChange, 
  onProductSelect, 
  onNewProduct, 
  placeholder = "Ürün seçin...", 
  className 
}: EInvoiceProductSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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

  const { data: products, isLoading } = useQuery({
    queryKey: ["products-for-einvoice-selector", companyId],
    queryFn: async () => {
      if (!companyId) {
        return [];
      }

      let query = supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("name");

      // Apply company filter
      if (companyId) {
        query = query.eq("company_id", companyId);
      }

      const { data: productsData, error } = await query;
      
      if (error) throw error;

      if (!productsData || productsData.length === 0) {
        return [];
      }

      // Depoları getir
      const { data: warehousesData } = await supabase
        .from("warehouses")
        .select("id, name, code")
        .eq("company_id", companyId)
        .eq("is_active", true);

      // Warehouse_stock tablosundan depo bazında stok bilgilerini çek
      const productIds = productsData.map(p => p.id);
      let stockMap = new Map<string, Array<{
        warehouse_id: string;
        warehouse_name: string;
        warehouse_code?: string;
        quantity: number;
      }>>();
      let totalStockMap = new Map<string, number>();

      if (companyId && productIds.length > 0 && warehousesData) {
        const { data: stockData } = await supabase
          .from("warehouse_stock")
          .select("product_id, warehouse_id, quantity")
          .in("product_id", productIds)
          .eq("company_id", companyId);

        if (stockData) {
          stockData.forEach((stock: { product_id: string; warehouse_id: string; quantity: number }) => {
            const warehouse = warehousesData.find(w => w.id === stock.warehouse_id);
            if (warehouse) {
              const existing = stockMap.get(stock.product_id) || [];
              existing.push({
                warehouse_id: stock.warehouse_id,
                warehouse_name: warehouse.name,
                warehouse_code: warehouse.code || undefined,
                quantity: Number(stock.quantity || 0)
              });
              stockMap.set(stock.product_id, existing);

              // Toplam stok hesapla
              const currentTotal = totalStockMap.get(stock.product_id) || 0;
              totalStockMap.set(stock.product_id, currentTotal + Number(stock.quantity || 0));
            }
          });
        }
      }

      // Ürünleri depo bilgisiyle birleştir
      return productsData.map(product => ({
        ...product,
        stock_quantity: totalStockMap.get(product.id) || 0,
        warehouses: stockMap.get(product.id) || [],
        total_stock: totalStockMap.get(product.id) || 0
      })) as ProductWithWarehouses[];
    },
    enabled: !!companyId,
  });

  // Filter products based on search query
  const filteredProducts = products?.filter(product => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      product.name.toLowerCase().includes(query) ||
      product.description?.toLowerCase().includes(query) ||
      product.sku?.toLowerCase().includes(query)
    );
  });

  const handleSelect = (product: ProductWithWarehouses) => {
    if (onProductSelect) {
      onProductSelect(product);
    } else {
      onChange(product.name, product);
    }
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between min-w-0 text-xs h-8 bg-background border-border hover:border-primary hover:bg-background transition-colors duration-200 focus:border-primary focus:ring-0",
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
          disabled={isLoading}
        >
          <span className="truncate text-left flex-1 min-w-0 text-xs" title={value || placeholder}>
            {value || <span className="text-muted-foreground">{placeholder}</span>}
          </span>
          <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[550px] p-0" align="start">
        <Command shouldFilter={false} className="rounded-lg border shadow-md">
          <CommandInput 
            placeholder="Ürün ara..." 
            className="h-9"
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList className="max-h-[500px]">
            <CommandEmpty className="py-6 text-center text-sm">
              Aramanızla eşleşen ürün bulunamadı.
            </CommandEmpty>
            <CommandGroup>
              {filteredProducts?.map((product) => (
                <CommandItem
                  key={product.id}
                  value={product.name}
                  onSelect={() => handleSelect(product)}
                  className="flex items-start gap-2 p-2 cursor-pointer hover:bg-muted/50 data-[selected=true]:bg-accent/10 data-[selected=true]:text-accent-foreground rounded-sm transition-colors"
                >
                  <Check
                    className={cn(
                      "h-4 w-4 shrink-0 mt-0.5",
                      value === product.name ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex-1 min-w-0 grid grid-cols-2 gap-2">
                    {/* Sol Sütun - Ürün Bilgileri */}
                    <div className="flex flex-col gap-1 min-w-0">
                      <span className="font-semibold text-foreground text-sm leading-tight truncate">
                        {product.name}
                      </span>
                      
                      {/* Fiyat */}
                      <div className="flex flex-col gap-0.5 text-xs">
                        <span className="font-semibold text-primary">
                          {formatCurrency(product.price, product.currency === 'TL' ? 'TRY' : (product.currency || 'TRY'))}
                        </span>
                      </div>

                      {/* Depo Bazında Stok - Kompakt */}
                      {product.warehouses && product.warehouses.length > 0 ? (
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {product.warehouses.slice(0, 2).map((warehouse, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] border border-blue-200"
                              title={`${warehouse.warehouse_name}: ${warehouse.quantity} ${product.unit}`}
                            >
                              <Warehouse className="h-2.5 w-2.5" />
                              <span className="font-medium truncate max-w-[60px]">{warehouse.warehouse_name}</span>
                              <span className="font-semibold">:{warehouse.quantity}</span>
                            </span>
                          ))}
                          {product.warehouses.length > 2 && (
                            <span className="text-[10px] text-muted-foreground px-1">
                              +{product.warehouses.length - 2}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground mt-0.5">
                          Stok yok
                        </span>
                      )}
                    </div>

                    {/* Sağ Sütun - Kod ve Kategori */}
                    <div className="flex flex-col items-end gap-1 text-right">
                      {product.sku && (
                        <span className="text-xs text-muted-foreground font-mono bg-gray-100 px-2 py-0.5 rounded">
                          {product.sku}
                        </span>
                      )}
                      {product.category_type && (
                        <span className="text-[10px] text-muted-foreground bg-gray-50 px-1.5 py-0.5 rounded">
                          {product.category_type}
                        </span>
                      )}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
            
            {/* Yeni Ürün Oluştur Butonu */}
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

export default EInvoiceProductSelector;

