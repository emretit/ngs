import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EnhancedDatePicker } from "@/components/ui/enhanced-date-picker";
import { Search, Calendar, Filter } from "lucide-react";

interface ChecksFilterBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  startDate?: Date;
  onStartDateChange: (date: Date | undefined) => void;
  endDate?: Date;
  onEndDateChange: (date: Date | undefined) => void;
  searchPlaceholder: string;
  statusOptions: { value: string; label: string }[];
}

export const ChecksFilterBar = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  searchPlaceholder,
  statusOptions,
}: ChecksFilterBarProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200 mb-4">
      <div className="relative min-w-[200px] flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder={searchPlaceholder}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 w-full h-8 text-sm"
        />
      </div>

      <Select value={statusFilter} onValueChange={onStatusChange}>
        <SelectTrigger className="w-[140px] h-8 text-sm">
          <Filter className="mr-2 h-4 w-4" />
          <SelectValue placeholder="Durum" />
        </SelectTrigger>
        <SelectContent>
          {statusOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <EnhancedDatePicker
          date={startDate}
          onSelect={(newDate) => newDate && onStartDateChange(newDate)}
          placeholder="Başlangıç"
          className="w-32 text-xs h-8"
        />
        <span className="text-muted-foreground text-sm">-</span>
        <EnhancedDatePicker
          date={endDate}
          onSelect={(newDate) => newDate && onEndDateChange(newDate)}
          placeholder="Bitiş"
          className="w-32 text-xs h-8"
        />
      </div>
    </div>
  );
};

