
import React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, User, Target, Calendar } from "lucide-react";
import { OpportunityStatus, opportunityStatusLabels } from "@/types/crm";
import { DatePicker } from "@/components/ui/date-picker";

interface OpportunityFilterBarProps {
  filterKeyword: string;
  setFilterKeyword: (value: string) => void;
  statusFilter: OpportunityStatus | "all";
  setStatusFilter: (value: OpportunityStatus | "all") => void;
  priorityFilter: string | null;
  setPriorityFilter: (value: string | null) => void;
  selectedEmployee?: string;
  setSelectedEmployee?: (value: string) => void;
  employees?: Array<{ id: string; first_name: string; last_name: string }>;
  startDate?: Date | undefined;
  setStartDate?: (value: Date | undefined) => void;
  endDate?: Date | undefined;
  setEndDate?: (value: Date | undefined) => void;
}

const OpportunityFilterBar = ({
  filterKeyword,
  setFilterKeyword,
  statusFilter,
  setStatusFilter,
  priorityFilter,
  setPriorityFilter,
  selectedEmployee = 'all',
  setSelectedEmployee,
  employees = [],
  startDate,
  setStartDate,
  endDate,
  setEndDate
}: OpportunityFilterBarProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
      <div className="relative min-w-[250px] flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Fırsat başlığı, açıklama veya müşteri adı ile ara..."
          value={filterKeyword}
          onChange={(e) => setFilterKeyword(e.target.value)}
          className="pl-10 w-full"
        />
      </div>
      
      <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as OpportunityStatus | "all")}>
        <SelectTrigger className="w-[180px]">
          <Filter className="mr-2 h-4 w-4" />
          <SelectValue placeholder="Durum" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tüm Durumlar</SelectItem>
          <SelectItem value="new">🆕 Yeni</SelectItem>
          <SelectItem value="meeting_visit">👥 Görüşme/Ziyaret</SelectItem>
          <SelectItem value="proposal">📄 Teklif</SelectItem>
          <SelectItem value="won">✅ Kazanıldı</SelectItem>
          <SelectItem value="lost">❌ Kaybedildi</SelectItem>
        </SelectContent>
      </Select>
      
      <Select 
        value={priorityFilter || "all"} 
        onValueChange={(value) => setPriorityFilter(value === "all" ? null : value)}
      >
        <SelectTrigger className="w-[180px]">
          <Target className="mr-2 h-4 w-4" />
          <SelectValue placeholder="Öncelik" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tüm Öncelikler</SelectItem>
          <SelectItem value="high">🔴 Yüksek</SelectItem>
          <SelectItem value="medium">🟡 Orta</SelectItem>
          <SelectItem value="low">🟢 Düşük</SelectItem>
        </SelectContent>
      </Select>

      {setSelectedEmployee && employees.length > 0 && (
        <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
          <SelectTrigger className="w-[200px]">
            <User className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Satış Temsilcisi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Temsilciler</SelectItem>
            {employees.map((employee) => (
              <SelectItem key={employee.id} value={employee.id}>
                {employee.first_name} {employee.last_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Tarih Filtreleri */}
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
    </div>
  );
};

export default OpportunityFilterBar;
