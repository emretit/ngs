import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, User, Calendar } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import { OrderStatus } from "@/types/orders";

interface OrdersFilterBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedStatus: string;
  setSelectedStatus: (status: string) => void;
  selectedCustomer: string;
  setSelectedCustomer: (customer: string) => void;
  startDate?: Date | undefined;
  setStartDate?: (value: Date | undefined) => void;
  endDate?: Date | undefined;
  setEndDate?: (value: Date | undefined) => void;
}

const OrdersFilterBar = ({
  searchQuery,
  setSearchQuery,
  selectedStatus,
  setSelectedStatus,
  selectedCustomer,
  setSelectedCustomer,
  startDate,
  setStartDate,
  endDate,
  setEndDate
}: OrdersFilterBarProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
      <div className="relative min-w-[250px] flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Sipariş no, müşteri adı ile ara..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 w-full"
        />
      </div>
      <Select value={selectedStatus} onValueChange={setSelectedStatus}>
        <SelectTrigger className="w-[180px]">
          <Filter className="mr-2 h-4 w-4" />
          <SelectValue placeholder="Durum" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tüm Durumlar</SelectItem>
          <SelectItem value="pending">⏳ Beklemede</SelectItem>
          <SelectItem value="confirmed">✅ Onaylandı</SelectItem>
          <SelectItem value="processing">⚙️ İşlemde</SelectItem>
          <SelectItem value="shipped">📦 Kargoda</SelectItem>
          <SelectItem value="delivered">🎯 Teslim Edildi</SelectItem>
          <SelectItem value="completed">✅ Tamamlandı</SelectItem>
          <SelectItem value="cancelled">❌ İptal Edildi</SelectItem>
        </SelectContent>
      </Select>
      <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
        <SelectTrigger className="w-[200px]">
          <User className="mr-2 h-4 w-4" />
          <SelectValue placeholder="Müşteri" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tüm Müşteriler</SelectItem>
          {/* TODO: Customer options will be populated from API */}
        </SelectContent>
      </Select>
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

export default OrdersFilterBar;