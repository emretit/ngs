import React, { memo } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ArrowUpDown } from "lucide-react";

type SortOption = 'name' | 'updated' | 'created';

interface PdfTemplatesFilterBarProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  typeFilter: string;
  setTypeFilter: (value: string) => void;
  sortBy: SortOption;
  setSortBy: (value: SortOption) => void;
}

const PdfTemplatesFilterBar = memo(({
  searchQuery,
  setSearchQuery,
  typeFilter,
  setTypeFilter,
  sortBy,
  setSortBy
}: PdfTemplatesFilterBarProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
      <div className="relative min-w-[250px] flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Şablon ara..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 w-full"
        />
      </div>
      
      <Select value={typeFilter} onValueChange={setTypeFilter}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Tip" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tüm Tipler</SelectItem>
          <SelectItem value="quote">Teklif</SelectItem>
          <SelectItem value="invoice">Fatura</SelectItem>
          <SelectItem value="proposal">Öneri</SelectItem>
          <SelectItem value="service">Servis</SelectItem>
        </SelectContent>
      </Select>

      <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
        <SelectTrigger className="w-[200px]">
          <ArrowUpDown className="h-4 w-4 mr-2" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="updated">Son Güncelleme</SelectItem>
          <SelectItem value="created">Oluşturulma Tarihi</SelectItem>
          <SelectItem value="name">İsme Göre</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
});

PdfTemplatesFilterBar.displayName = 'PdfTemplatesFilterBar';

export { PdfTemplatesFilterBar };
export type { PdfTemplatesFilterBarProps };

