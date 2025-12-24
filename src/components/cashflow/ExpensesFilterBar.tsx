import React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, User, Tag, CalendarIcon } from "lucide-react";
import { EnhancedDatePicker } from "@/components/ui/enhanced-date-picker";

interface ExpensesFilterBarProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  filterType: 'all' | 'company' | 'employee';
  setFilterType: (value: 'all' | 'company' | 'employee') => void;
  filterEmployee: string;
  setFilterEmployee: (value: string) => void;
  filterCategory: string;
  setFilterCategory: (value: string) => void;
  employees: Array<{id: string, first_name: string, last_name: string, department: string}>;
  categories: Array<{id: string, name: string}>;
  startDate: Date;
  endDate: Date;
  onStartDateChange: (date: Date) => void;
  onEndDateChange: (date: Date) => void;
}

const ExpensesFilterBar = ({
  searchQuery,
  setSearchQuery,
  filterType,
  setFilterType,
  filterEmployee,
  setFilterEmployee,
  filterCategory,
  setFilterCategory,
  employees,
  categories,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange
}: ExpensesFilterBarProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
      <div className="relative min-w-[250px] flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Açıklama, kategori veya çalışan adı ile ara..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 w-full"
        />
      </div>
      
      <Select value={filterType} onValueChange={(value: 'all' | 'company' | 'employee') => setFilterType(value)}>
        <SelectTrigger className="w-[180px]">
          <Filter className="mr-2 h-4 w-4" />
          <SelectValue placeholder="Tür" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Türler</SelectItem>
          <SelectItem value="company">Şirket</SelectItem>
          <SelectItem value="employee">Çalışan</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filterEmployee} onValueChange={setFilterEmployee}>
        <SelectTrigger className="w-[200px]">
          <User className="mr-2 h-4 w-4" />
          <SelectValue placeholder="Çalışan" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Çalışanlar</SelectItem>
          {employees.map((employee) => (
            <SelectItem key={employee.id} value={employee.id}>
              {employee.first_name} {employee.last_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filterCategory} onValueChange={setFilterCategory}>
        <SelectTrigger className="w-[200px]">
          <Tag className="mr-2 h-4 w-4" />
          <SelectValue placeholder="Kategori" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Kategoriler</SelectItem>
          {categories.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Tarih Filtreleri */}
      <div className="flex items-center gap-2">
        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
        <EnhancedDatePicker
          date={startDate}
          onSelect={(newDate) => newDate && onStartDateChange(newDate)}
          placeholder="Başlangıç"
          className="w-32 text-xs"
        />
        <span className="text-muted-foreground text-sm">-</span>
        <EnhancedDatePicker
          date={endDate}
          onSelect={(newDate) => newDate && onEndDateChange(newDate)}
          placeholder="Bitiş"
          className="w-32 text-xs"
        />
      </div>
    </div>
  );
};

export default ExpensesFilterBar;

