import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, User } from "lucide-react";
import { OrderStatus } from "@/types/orders";

interface OrdersFilterBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedStatus: string;
  setSelectedStatus: (status: string) => void;
  selectedCustomer: string;
  setSelectedCustomer: (customer: string) => void;
}

const OrdersFilterBar = ({
  searchQuery,
  setSearchQuery,
  selectedStatus,
  setSelectedStatus,
  selectedCustomer,
  setSelectedCustomer
}: OrdersFilterBarProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 p-6 bg-gradient-to-r from-card/80 to-muted/40 rounded-xl border border-border/30 shadow-lg backdrop-blur-sm">
      <div className="relative w-[400px]">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Sipariş no, müşteri adı ile ara..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
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
    </div>
  );
};

export default OrdersFilterBar;