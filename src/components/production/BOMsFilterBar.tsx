import React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Package, Calendar } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";

interface BOMsFilterBarProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  selectedProduct?: string;
  setSelectedProduct?: (value: string) => void;
  products?: Array<{ id: string; name: string }>;
  startDate?: Date | undefined;
  setStartDate?: (value: Date | undefined) => void;
  endDate?: Date | undefined;
  setEndDate?: (value: Date | undefined) => void;
}

const BOMsFilterBar = ({
  searchQuery,
  setSearchQuery,
  selectedProduct = 'all',
  setSelectedProduct,
  products = [],
  startDate,
  setStartDate,
  endDate,
  setEndDate
}: BOMsFilterBarProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
      <div className="relative min-w-[250px] flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Reçete adı, ürün adı veya açıklama ile ara..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 w-full"
        />
      </div>
      
      {setSelectedProduct && products.length > 0 && (
        <Select value={selectedProduct} onValueChange={setSelectedProduct}>
          <SelectTrigger className="w-[200px]">
            <Package className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Ürün" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Ürünler</SelectItem>
            {products.map((product) => (
              <SelectItem key={product.id} value={product.id}>
                {product.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Tarih Filtreleri */}
      {setStartDate && setEndDate && (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <DatePicker
            date={startDate}
            onSelect={setStartDate}
            placeholder="Başlangıç"
          />
          <span className="text-muted-foreground text-sm">-</span>
          <DatePicker
            date={endDate}
            onSelect={setEndDate}
            placeholder="Bitiş"
          />
        </div>
      )}
    </div>
  );
};

export default BOMsFilterBar;
