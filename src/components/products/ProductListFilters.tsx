import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProductListFiltersProps {
  search: string;
  setSearch: (value: string) => void;
  categoryFilter: string;
  setCategoryFilter: (value: string) => void;
  stockFilter: string;
  setStockFilter: (value: string) => void;
  categories: { id: string; name: string }[];
}

const ProductListFilters = ({
  search,
  setSearch,
  categoryFilter,
  setCategoryFilter,
  stockFilter,
  setStockFilter,
  categories,
}: ProductListFiltersProps) => {
  const hasActiveFilters =
    search ||
    categoryFilter !== "all" ||
    stockFilter !== "all";

  const clearFilters = () => {
    setSearch("");
    setCategoryFilter("all");
    setStockFilter("all");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Ürün adı, SKU veya açıklama ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Category Filter */}
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full md:w-[200px]">
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

        {/* Stock Filter */}
        <Select value={stockFilter} onValueChange={setStockFilter}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Stok Durumu" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Stoklar</SelectItem>
            <SelectItem value="in_stock">Stokta (5+)</SelectItem>
            <SelectItem value="low_stock">Düşük Stok (1-5)</SelectItem>
            <SelectItem value="out_of_stock">Stok Tükendi (0)</SelectItem>
          </SelectContent>
        </Select>

      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Filter className="h-4 w-4" />
            <span>Filtreler aktif</span>
            {search && <span className="px-2 py-1 bg-background rounded text-xs">Arama: "{search}"</span>}
            {categoryFilter !== "all" && <span className="px-2 py-1 bg-background rounded text-xs">Kategori</span>}
            {stockFilter !== "all" && <span className="px-2 py-1 bg-background rounded text-xs">Stok</span>}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-muted-foreground hover:text-foreground"
          >
            Temizle
          </Button>
        </div>
      )}
    </div>
  );
};

export default ProductListFilters;