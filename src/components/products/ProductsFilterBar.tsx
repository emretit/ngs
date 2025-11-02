import React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Package } from "lucide-react";

interface ProductsFilterBarProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  categoryFilter: string;
  setCategoryFilter: (value: string) => void;
  stockFilter: string;
  setStockFilter: (value: string) => void;
  categories: { id: string; name: string }[];
}

const ProductsFilterBar = ({
  searchQuery,
  setSearchQuery,
  categoryFilter,
  setCategoryFilter,
  stockFilter,
  setStockFilter,
  categories
}: ProductsFilterBarProps) => {
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

