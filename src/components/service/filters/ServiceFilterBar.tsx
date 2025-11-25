import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, User, Calendar } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";

interface ServiceFilterBarProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  selectedStatus: string | null;
  setSelectedStatus: (value: string | null) => void;
  selectedPriority: string | null;
  setSelectedPriority: (value: string | null) => void;
  selectedTechnician: string | null;
  setSelectedTechnician: (value: string | null) => void;
  technicians?: Array<{ id: string; first_name: string; last_name: string }>;
  startDate?: Date | undefined;
  setStartDate?: (value: Date | undefined) => void;
  endDate?: Date | undefined;
  setEndDate?: (value: Date | undefined) => void;
}

const ServiceFilterBar = ({
  searchQuery,
  setSearchQuery,
  selectedStatus,
  setSelectedStatus,
  selectedPriority,
  setSelectedPriority,
  selectedTechnician,
  setSelectedTechnician,
  technicians,
  startDate,
  setStartDate,
  endDate,
  setEndDate
}: ServiceFilterBarProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
      <div className="relative min-w-[250px] flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Servis başlığı, numarası veya müşteri ile ara..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 w-full"
        />
      </div>
      
      <Select
        value={selectedStatus || "all"}
        onValueChange={(value) => setSelectedStatus(value === "all" ? null : value)}
      >
        <SelectTrigger className="w-[180px]">
          <Filter className="mr-2 h-4 w-4" />
          <SelectValue placeholder="Durum" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tüm Durumlar</SelectItem>
          <SelectItem value="new">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <span>Yeni</span>
            </div>
          </SelectItem>
          <SelectItem value="assigned">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-500"></span>
              <span>Atanmış</span>
            </div>
          </SelectItem>
          <SelectItem value="in_progress">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
              <span>Devam Ediyor</span>
            </div>
          </SelectItem>
          <SelectItem value="on_hold">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-orange-500"></span>
              <span>Beklemede</span>
            </div>
          </SelectItem>
          <SelectItem value="completed">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              <span>Tamamlandı</span>
            </div>
          </SelectItem>
          <SelectItem value="cancelled">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500"></span>
              <span>İptal Edildi</span>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={selectedPriority || "all"}
        onValueChange={(value) => setSelectedPriority(value === "all" ? null : value)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Öncelik" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tüm Öncelikler</SelectItem>
          <SelectItem value="high">🔴 Yüksek</SelectItem>
          <SelectItem value="medium">🟡 Orta</SelectItem>
          <SelectItem value="low">🟢 Düşük</SelectItem>
        </SelectContent>
      </Select>

      {technicians && technicians.length > 0 && (
        <Select
          value={selectedTechnician || "all"}
          onValueChange={(value) => setSelectedTechnician(value === "all" ? null : value)}
        >
          <SelectTrigger className="w-[200px]">
            <User className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Teknisyen" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Teknisyenler</SelectItem>
            {technicians.map((technician) => (
              <SelectItem key={technician.id} value={technician.id}>
                {technician.first_name} {technician.last_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

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

export default ServiceFilterBar;


