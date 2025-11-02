import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, User, Calendar, Truck } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import { DeliveryStatus, ShippingMethod } from "@/types/deliveries";

interface DeliveriesFilterBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedStatus: string;
  setSelectedStatus: (status: string) => void;
  selectedShippingMethod: string;
  setSelectedShippingMethod: (method: string) => void;
  selectedCustomer: string;
  setSelectedCustomer: (customer: string) => void;
  startDate?: Date | undefined;
  setStartDate?: (value: Date | undefined) => void;
  endDate?: Date | undefined;
  setEndDate?: (value: Date | undefined) => void;
}

const DeliveriesFilterBar = ({
  searchQuery,
  setSearchQuery,
  selectedStatus,
  setSelectedStatus,
  selectedShippingMethod,
  setSelectedShippingMethod,
  selectedCustomer,
  setSelectedCustomer,
  startDate,
  setStartDate,
  endDate,
  setEndDate
}: DeliveriesFilterBarProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
      <div className="relative min-w-[250px] flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Teslimat no, müşteri adı, takip no ile ara..."
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
          <SelectItem value="pending">⏳ Bekleyen</SelectItem>
          <SelectItem value="prepared">📦 Hazırlanan</SelectItem>
          <SelectItem value="shipped">🚚 Kargoda</SelectItem>
          <SelectItem value="delivered">✅ Teslim Edildi</SelectItem>
          <SelectItem value="cancelled">❌ İptal Edildi</SelectItem>
        </SelectContent>
      </Select>
      
      <Select value={selectedShippingMethod} onValueChange={setSelectedShippingMethod}>
        <SelectTrigger className="w-[180px]">
          <Truck className="mr-2 h-4 w-4" />
          <SelectValue placeholder="Sevkiyat Yöntemi" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tüm Yöntemler</SelectItem>
          <SelectItem value="kargo">🚚 Kargo</SelectItem>
          <SelectItem value="sirket_araci">🚗 Şirket Aracı</SelectItem>
          <SelectItem value="musteri_alacak">👤 Müşteri Alacak</SelectItem>
          <SelectItem value="diger">📦 Diğer</SelectItem>
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

export default DeliveriesFilterBar;
