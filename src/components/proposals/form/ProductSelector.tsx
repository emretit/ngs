import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/types/product";

interface ProductSelectorProps {
  value: string;
  onChange: (productName: string, product?: Product) => void;
  onProductSelect?: (product: Product) => void;
  placeholder?: string;
  className?: string;
}

const ProductSelector = ({ value, onChange, onProductSelect, placeholder = "Ürün seçin...", className }: ProductSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: products, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("name");
      
      if (error) throw error;
      return data as Product[];
    },
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

  const handleSelect = (product: Product) => {
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
            "w-full justify-between",
            !value && "text-muted-foreground",
            className
          )}
          disabled={isLoading}
        >
          <span className="truncate text-left flex-1">{value || placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[500px] p-0" align="start">
        <Command shouldFilter={false} className="rounded-lg border shadow-md">
          <CommandInput 
            placeholder="Ürün ara..." 
            className="h-9"
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList className="max-h-[400px]">
            <CommandEmpty className="py-6 text-center text-sm">
              Aramanızla eşleşen ürün bulunamadı.
            </CommandEmpty>
            <CommandGroup>
              {filteredProducts?.map((product) => (
                <CommandItem
                  key={product.id}
                  value={product.name}
                  onSelect={() => handleSelect(product)}
                  className="flex items-start gap-3 p-3 cursor-pointer hover:bg-muted/50 data-[selected=true]:bg-accent/10 data-[selected=true]:text-accent-foreground rounded-sm transition-colors"
                >
                  <Check
                    className={cn(
                      "h-4 w-4 shrink-0 mt-1",
                      value === product.name ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold text-foreground text-sm leading-tight">
                        {product.name}
                      </span>
                      {product.sku && (
                        <span className="text-xs text-muted-foreground">
                          Kod: {product.sku}
                        </span>
                      )}
                    </div>
                    {product.description && (
                      <span className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {product.description}
                      </span>
                    )}
                    <div className="flex items-center gap-3 text-xs">
                      <span className="font-semibold text-primary">
                        {new Intl.NumberFormat('tr-TR', { 
                          style: 'currency', 
                          currency: product.currency || 'TRY',
                          minimumFractionDigits: 2
                        }).format(product.price)}
                      </span>
                      <span className="text-muted-foreground">
                        Stok: {product.stock_quantity} {product.unit}
                      </span>
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default ProductSelector;