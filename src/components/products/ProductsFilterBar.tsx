import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Package, Warehouse } from "lucide-react";

interface ProductsFilterBarProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  categoryFilter: string;
  setCategoryFilter: (value: string) => void;
  stockFilter: string;
  setStockFilter: (value: string) => void;
  warehouseFilter?: string;
  setWarehouseFilter?: (value: string) => void;
  categories: { id: string; name: string }[];
}

const ProductsFilterBar = ({
  searchQuery,
  setSearchQuery,
  categoryFilter,
  setCategoryFilter,
  stockFilter,
  setStockFilter,
  warehouseFilter = "all",
  setWarehouseFilter,
  categories
}: ProductsFilterBarProps) => {
  // Depoları getir
  const { data: warehouses = [] } = useQuery({
    queryKey: ["warehouses"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user?.id)
        .single();

      if (!profile?.company_id) return [];

      const { data, error } = await supabase
        .from("warehouses")
        .select("id, name, code")
        
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      return data || [];
    },
  });

  return (
    <div className="flex flex-col sm:flex-row gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
      <div className="relative min-w-[250px] flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Ürün adı, SKU veya açıklama ile ara..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 w-full"
        />
      </div>
      
      <Select value={categoryFilter} onValueChange={setCategoryFilter}>
        <SelectTrigger className="w-[180px]">
          <Package className="mr-2 h-4 w-4" />
          <SelectValue placeholder="Kategori" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tüm Kategoriler</SelectItem>
          {categories.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {setWarehouseFilter && (
        <Select value={warehouseFilter} onValueChange={setWarehouseFilter}>
          <SelectTrigger className="w-[180px]">
            <Warehouse className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Depo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Depolar</SelectItem>
            {warehouses.map((warehouse) => (
              <SelectItem key={warehouse.id} value={warehouse.id}>
                {warehouse.name}{warehouse.code ? ` (${warehouse.code})` : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <Select value={stockFilter} onValueChange={setStockFilter}>
        <SelectTrigger className="w-[180px]">
          <Filter className="mr-2 h-4 w-4" />
          <SelectValue placeholder="Stok Durumu" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tüm Stoklar</SelectItem>
          <SelectItem value="in_stock">Stokta (5+)</SelectItem>
          <SelectItem value="low_stock">Düşük Stok (1-5)</SelectItem>
          <SelectItem value="out_of_stock">Tükendi (0)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default ProductsFilterBar;

