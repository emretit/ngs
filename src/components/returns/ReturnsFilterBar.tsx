import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, User, Calendar, RotateCcw, AlertTriangle } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";

interface ReturnsFilterBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedStatus: string;
  setSelectedStatus: (status: string) => void;
  selectedType: string;
  setSelectedType: (type: string) => void;
  selectedReason: string;
  setSelectedReason: (reason: string) => void;
  selectedCustomer: string;
  setSelectedCustomer: (customer: string) => void;
  startDate?: Date | undefined;
  setStartDate?: (value: Date | undefined) => void;
  endDate?: Date | undefined;
  setEndDate?: (value: Date | undefined) => void;
}

const ReturnsFilterBar = ({
  searchQuery,
  setSearchQuery,
  selectedStatus,
  setSelectedStatus,
  selectedType,
  setSelectedType,
  selectedReason,
  setSelectedReason,
  selectedCustomer,
  setSelectedCustomer,
  startDate,
  setStartDate,
  endDate,
  setEndDate
}: ReturnsFilterBarProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
      <div className="relative min-w-[250px] flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="İade no, müşteri adı ile ara..."
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
          <SelectItem value="under_review">🔍 İnceleniyor</SelectItem>
          <SelectItem value="approved">✅ Onaylandı</SelectItem>
          <SelectItem value="rejected">❌ Reddedildi</SelectItem>
          <SelectItem value="completed">✓ Tamamlandı</SelectItem>
          <SelectItem value="cancelled">🚫 İptal Edildi</SelectItem>
        </SelectContent>
      </Select>
      
      <Select value={selectedType} onValueChange={setSelectedType}>
        <SelectTrigger className="w-[160px]">
          <RotateCcw className="mr-2 h-4 w-4" />
          <SelectValue placeholder="İade Türü" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tüm Türler</SelectItem>
          <SelectItem value="product_return">📦 Ürün İadesi</SelectItem>
          <SelectItem value="exchange">🔄 Değişim</SelectItem>
          <SelectItem value="refund">💰 Para İadesi</SelectItem>
        </SelectContent>
      </Select>

      <Select value={selectedReason} onValueChange={setSelectedReason}>
        <SelectTrigger className="w-[180px]">
          <AlertTriangle className="mr-2 h-4 w-4" />
          <SelectValue placeholder="Neden" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tüm Nedenler</SelectItem>
          <SelectItem value="defective">🔧 Defolu Ürün</SelectItem>
          <SelectItem value="wrong_product">❓ Yanlış Ürün</SelectItem>
          <SelectItem value="customer_changed_mind">💭 Müşteri Vazgeçti</SelectItem>
          <SelectItem value="damaged_in_shipping">📦 Kargoda Hasar</SelectItem>
          <SelectItem value="other">📝 Diğer</SelectItem>
        </SelectContent>
      </Select>

      <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
        <SelectTrigger className="w-[180px]">
          <User className="mr-2 h-4 w-4" />
          <SelectValue placeholder="Müşteri" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tüm Müşteriler</SelectItem>
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

export default ReturnsFilterBar;
