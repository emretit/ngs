import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AccountDetailSearchFilterProps } from "./types";

/**
 * Account Detail Search & Filter Component
 * Search input and filter dropdowns for transaction filtering
 *
 * Reference: CreditCardDetail.tsx lines 361-383
 */
export function AccountDetailSearchFilter({
  searchQuery,
  onSearchChange,
  filterType,
  onFilterTypeChange,
  filterConfig = {},
}: AccountDetailSearchFilterProps) {
  const {
    categories = [],
    showDateRange = false,
    showCategoryFilter = false,
    additionalFilters,
  } = filterConfig;

  return (
    <div className="flex flex-col sm:flex-row gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200 mb-2">
      {/* Search Input */}
      <div className="relative min-w-[250px] flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="İşlem açıklaması veya kategori ile ara..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 w-full bg-white"
        />
      </div>

      {/* Filter Type Select */}
      <Select value={filterType} onValueChange={onFilterTypeChange}>
        <SelectTrigger className="w-[160px] h-9 bg-white">
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5" />
            <SelectValue placeholder="Filtrele" />
          </div>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tüm İşlemler</SelectItem>
          <SelectItem value="income">Gelir</SelectItem>
          <SelectItem value="expense">Gider</SelectItem>
        </SelectContent>
      </Select>

      {/* Optional Category Filter */}
      {showCategoryFilter && categories.length > 0 && (
        <Select defaultValue="all">
          <SelectTrigger className="w-[180px] h-9 bg-white">
            <SelectValue placeholder="Kategori" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Kategoriler</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.value} value={category.value}>
                {category.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Optional Date Range Filter */}
      {showDateRange && (
        <div className="flex items-center gap-2">
          {/* Date range picker can be added here if needed */}
          <span className="text-xs text-muted-foreground">Tarih aralığı</span>
        </div>
      )}

      {/* Additional Custom Filters */}
      {additionalFilters}
    </div>
  );
}
