import React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, AlertCircle, Calendar, Building2 } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";

interface PurchaseRequestsFilterBarProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  selectedStatus: string;
  setSelectedStatus: (value: string) => void;
  selectedPriority: string;
  setSelectedPriority: (value: string) => void;
  selectedDepartment?: string;
  setSelectedDepartment?: (value: string) => void;
  departments?: Array<{ id: string; name: string }>;
  startDate?: Date | undefined;
  setStartDate?: (value: Date | undefined) => void;
  endDate?: Date | undefined;
  setEndDate?: (value: Date | undefined) => void;
}

const PurchaseRequestsFilterBar = ({
  searchQuery,
  setSearchQuery,
  selectedStatus,
  setSelectedStatus,
  selectedPriority,
  setSelectedPriority,
  selectedDepartment = 'all',
  setSelectedDepartment,
  departments = [],
  startDate,
  setStartDate,
  endDate,
  setEndDate
}: PurchaseRequestsFilterBarProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
      <div className="relative min-w-[250px] flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Talep no, başlık veya notlar ile ara..."
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
          <SelectItem value="draft">📄 Taslak</SelectItem>
          <SelectItem value="submitted">⏳ Onay Bekliyor</SelectItem>
          <SelectItem value="approved">✅ Onaylandı</SelectItem>
          <SelectItem value="rejected">❌ Reddedildi</SelectItem>
          <SelectItem value="converted">🔄 Dönüştürüldü</SelectItem>
        </SelectContent>
      </Select>

      <Select value={selectedPriority} onValueChange={setSelectedPriority}>
        <SelectTrigger className="w-[180px]">
          <AlertCircle className="mr-2 h-4 w-4" />
          <SelectValue placeholder="Öncelik" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tüm Öncelikler</SelectItem>
          <SelectItem value="low">🟢 Düşük</SelectItem>
          <SelectItem value="normal">🟡 Normal</SelectItem>
          <SelectItem value="high">🟠 Yüksek</SelectItem>
          <SelectItem value="urgent">🔴 Acil</SelectItem>
        </SelectContent>
      </Select>

      {setSelectedDepartment && departments.length > 0 && (
        <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
          <SelectTrigger className="w-[200px]">
            <Building2 className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Departman" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Departmanlar</SelectItem>
            {departments.map((dept) => (
              <SelectItem key={dept.id} value={dept.id}>
                {dept.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

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

export default React.memo(PurchaseRequestsFilterBar);

