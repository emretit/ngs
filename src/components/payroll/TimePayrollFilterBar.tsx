import React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Calendar, Users } from "lucide-react";

interface TimePayrollFilterBarProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  selectedYear: number;
  setSelectedYear: (value: number) => void;
  selectedMonth: number;
  setSelectedMonth: (value: number) => void;
  selectedEmployee?: string;
  setSelectedEmployee?: (value: string) => void;
  selectedStatus?: string;
  setSelectedStatus?: (value: string) => void;
  employees?: Array<{ id: string; first_name: string; last_name: string }>;
}

const TimePayrollFilterBar = ({
  searchQuery,
  setSearchQuery,
  selectedYear,
  setSelectedYear,
  selectedMonth,
  setSelectedMonth,
  selectedEmployee = 'all',
  setSelectedEmployee,
  selectedStatus = 'all',
  setSelectedStatus,
  employees = []
}: TimePayrollFilterBarProps) => {
  const months = [
    { value: 1, label: "Ocak" },
    { value: 2, label: "Şubat" },
    { value: 3, label: "Mart" },
    { value: 4, label: "Nisan" },
    { value: 5, label: "Mayıs" },
    { value: 6, label: "Haziran" },
    { value: 7, label: "Temmuz" },
    { value: 8, label: "Ağustos" },
    { value: 9, label: "Eylül" },
    { value: 10, label: "Ekim" },
    { value: 11, label: "Kasım" },
    { value: 12, label: "Aralık" },
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  return (
    <div className="flex flex-col sm:flex-row gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
      <div className="relative min-w-[250px] flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Çalışan adı ile ara..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 w-full"
        />
      </div>

      <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
        <SelectTrigger className="w-[150px]">
          <Calendar className="mr-2 h-4 w-4" />
          <SelectValue placeholder="Ay" />
        </SelectTrigger>
        <SelectContent>
          {months.map((month) => (
            <SelectItem key={month.value} value={month.value.toString()}>
              {month.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
        <SelectTrigger className="w-[120px]">
          <SelectValue placeholder="Yıl" />
        </SelectTrigger>
        <SelectContent>
          {years.map((year) => (
            <SelectItem key={year} value={year.toString()}>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {setSelectedStatus && (
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-[180px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Durum" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Durumlar</SelectItem>
            <SelectItem value="draft">📝 Taslak</SelectItem>
            <SelectItem value="approved">✅ Onaylı</SelectItem>
            <SelectItem value="locked">🔒 Kilitli</SelectItem>
          </SelectContent>
        </Select>
      )}

      {setSelectedEmployee && employees.length > 0 && (
        <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
          <SelectTrigger className="w-[200px]">
            <Users className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Çalışan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Çalışanlar</SelectItem>
            {employees.map((employee) => (
              <SelectItem key={employee.id} value={employee.id}>
                {employee.first_name} {employee.last_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
};

export default TimePayrollFilterBar;
