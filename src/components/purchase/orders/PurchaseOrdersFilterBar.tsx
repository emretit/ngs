import React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Search, Calendar as CalendarIcon, X, Filter } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface PurchaseOrdersFilterBarProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  selectedStatus: string;
  setSelectedStatus: (value: string) => void;
  selectedSupplier: string;
  setSelectedSupplier: (value: string) => void;
  suppliers: any[];
  startDate: Date | undefined;
  setStartDate: (date: Date | undefined) => void;
  endDate: Date | undefined;
  setEndDate: (date: Date | undefined) => void;
}

const PurchaseOrdersFilterBar = ({
  searchQuery,
  setSearchQuery,
  selectedStatus,
  setSelectedStatus,
  selectedSupplier,
  setSelectedSupplier,
  suppliers,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
}: PurchaseOrdersFilterBarProps) => {

  const hasActiveFilters = selectedStatus !== 'all' || selectedSupplier !== 'all' || startDate || endDate || searchQuery;

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedStatus("all");
    setSelectedSupplier("all");
    setStartDate(undefined);
    setEndDate(undefined);
  };

  return (
    <div className="flex flex-col gap-3 p-3 bg-white rounded-md border border-gray-200 shadow-sm">
      {/* İlk satır: Arama ve Filtreler */}
      <div className="flex flex-col sm:flex-row gap-2">
        {/* Arama */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Sipariş no, not ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
              onClick={() => setSearchQuery("")}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Durum Filtresi */}
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Durum" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Durumlar</SelectItem>
            <SelectItem value="draft">Taslak</SelectItem>
            <SelectItem value="submitted">Onayda</SelectItem>
            <SelectItem value="confirmed">Onaylandı</SelectItem>
            <SelectItem value="partial_received">Kısmi Teslim</SelectItem>
            <SelectItem value="received">Teslim Alındı</SelectItem>
            <SelectItem value="cancelled">İptal</SelectItem>
          </SelectContent>
        </Select>

        {/* Tedarikçi Filtresi */}
        <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Tedarikçi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Tedarikçiler</SelectItem>
            {suppliers?.map((supplier) => (
              <SelectItem key={supplier.id} value={supplier.id}>
                {supplier.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Tarih Aralığı */}
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full sm:w-[140px] justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "dd MMM yyyy", { locale: tr }) : "Başlangıç"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={setStartDate}
                initialFocus
                locale={tr}
              />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full sm:w-[140px] justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "dd MMM yyyy", { locale: tr }) : "Bitiş"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={setEndDate}
                initialFocus
                locale={tr}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Filtreleri Temizle */}
        {hasActiveFilters && (
          <Button
            variant="outline"
            size="icon"
            onClick={clearFilters}
            title="Filtreleri Temizle"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Aktif filtre göstergesi */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Filter className="h-3 w-3" />
          <span>
            {selectedStatus !== 'all' && `Durum: ${selectedStatus}, `}
            {selectedSupplier !== 'all' && `Tedarikçi seçili, `}
            {(startDate || endDate) && 'Tarih filtresi aktif, '}
            {searchQuery && `"${searchQuery}" araması aktif`}
          </span>
        </div>
      )}
    </div>
  );
};

export default React.memo(PurchaseOrdersFilterBar);
