import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
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
  return (
    <div className="mb-6 flex gap-4 items-center">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <Input
          placeholder="Ürün ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>
      <Select value={categoryFilter} onValueChange={setCategoryFilter}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Tüm Kategoriler" />
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
          <SelectValue placeholder="Stok Durumu" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tüm Stoklar</SelectItem>
          <SelectItem value="in_stock">Stokta</SelectItem>
          <SelectItem value="low_stock">Az Stok</SelectItem>
          <SelectItem value="out_of_stock">Stok Yok</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default ProductListFilters;
