import React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Building2, User, Calendar } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";

interface CustomersFilterBarProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  selectedStatus: string;
  setSelectedStatus: (value: string) => void;
  selectedType: string;
  setSelectedType: (value: string) => void;
  startDate?: Date | undefined;
  setStartDate?: (value: Date | undefined) => void;
  endDate?: Date | undefined;
  setEndDate?: (value: Date | undefined) => void;
}

const CustomersFilterBar = ({
  searchQuery,
  setSearchQuery,
  selectedStatus,
  setSelectedStatus,
  selectedType,
  setSelectedType,
  startDate,
  setStartDate,
  endDate,
  setEndDate
}: CustomersFilterBarProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
      <div className="relative min-w-[250px] flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Müşteri adı, şirket veya e-posta ile ara..."
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
          <SelectItem value="aktif">✅ Aktif</SelectItem>
          <SelectItem value="pasif">⏸️ Pasif</SelectItem>
          <SelectItem value="potansiyel">🎯 Potansiyel</SelectItem>
        </SelectContent>
      </Select>

      <Select value={selectedType} onValueChange={setSelectedType}>
        <SelectTrigger className="w-[180px]">
          <Building2 className="mr-2 h-4 w-4" />
          <SelectValue placeholder="Tip" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tüm Tipler</SelectItem>
          <SelectItem value="kurumsal">🏢 Kurumsal</SelectItem>
          <SelectItem value="bireysel">👤 Bireysel</SelectItem>
        </SelectContent>
      </Select>

      {/* Tarih Filtreleri */}
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

export default CustomersFilterBar;
