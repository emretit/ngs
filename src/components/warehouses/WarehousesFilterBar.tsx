import React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Warehouse } from "lucide-react";

interface WarehousesFilterBarProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  typeFilter: string;
  setTypeFilter: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
}

const WarehousesFilterBar = ({
  searchQuery,
  setSearchQuery,
  typeFilter,
  setTypeFilter,
  statusFilter,
  setStatusFilter
}: WarehousesFilterBarProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
      <div className="relative min-w-[250px] flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Depo adı, kod veya adres ile ara..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 w-full"
        />
      </div>
      
      <Select value={typeFilter} onValueChange={setTypeFilter}>
        <SelectTrigger className="w-[180px]">
          <Warehouse className="mr-2 h-4 w-4" />
          <SelectValue placeholder="Depo Tipi" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tüm Tipler</SelectItem>
          <SelectItem value="main">Ana Depo</SelectItem>
          <SelectItem value="sub">Alt Depo</SelectItem>
          <SelectItem value="virtual">Sanal Depo</SelectItem>
          <SelectItem value="transit">Geçici Depo</SelectItem>
        </SelectContent>
      </Select>

      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-[180px]">
          <Filter className="mr-2 h-4 w-4" />
          <SelectValue placeholder="Durum" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tüm Durumlar</SelectItem>
          <SelectItem value="active">Aktif</SelectItem>
          <SelectItem value="inactive">Pasif</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default WarehousesFilterBar;

