import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Search, Calendar, X, RefreshCw } from "lucide-react";

interface LeaveFiltersProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  startDate?: Date | undefined;
  setStartDate?: (value: Date | undefined) => void;
  endDate?: Date | undefined;
  setEndDate?: (value: Date | undefined) => void;
  onClear: () => void;
  onRefresh: () => void;
}

export const LeaveFilters = ({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  onClear,
  onRefresh,
}: LeaveFiltersProps) => {
  const hasActiveFilters = 
    searchQuery || 
    statusFilter !== 'all' || 
    startDate || 
    endDate;

  return (
    <div className="flex flex-col sm:flex-row gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
      {/* Arama Input */}
      <div className="relative min-w-[250px] flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Çalışan adı, departman veya izin türü ile ara..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 w-full"
        />
      </div>

      {/* Durum Filtresi */}
      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Durum" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tüm Durumlar</SelectItem>
          <SelectItem value="pending">Beklemede</SelectItem>
          <SelectItem value="approved">Onaylandı</SelectItem>
          <SelectItem value="rejected">Reddedildi</SelectItem>
          <SelectItem value="cancelled">İptal Edildi</SelectItem>
        </SelectContent>
      </Select>

      {/* Tarih Aralığı */}
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

      {/* Temizle ve Yenile Butonları */}
      <div className="flex items-center gap-2">
        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClear}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Temizle
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Yenile
        </Button>
      </div>
    </div>
  );
};

