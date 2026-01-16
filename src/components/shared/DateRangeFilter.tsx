import React from "react";
import { Calendar } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import { getStartOfDay, getEndOfDay } from "@/utils/dateUtils";

interface DateRangeFilterProps {
  startDate?: Date | undefined;
  setStartDate?: (value: Date | undefined) => void;
  endDate?: Date | undefined;
  setEndDate?: (value: Date | undefined) => void;
  className?: string;
}

/**
 * Ortak tarih aralığı filtresi component'i
 * startDate ve endDate'i otomatik olarak günün başı/sonu olarak ayarlar
 */
export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  className = ""
}) => {
  // Tarih seçildiğinde otomatik olarak günün başı/sonu olarak ayarla
  const handleStartDateSelect = (date: Date | undefined) => {
    if (date && setStartDate) {
      // Yerel saat diliminde yeni bir tarih oluştur (timezone kaymasını önlemek için)
      const year = date.getFullYear();
      const month = date.getMonth();
      const day = date.getDate();
      const localDate = new Date(year, month, day, 0, 0, 0, 0);
      setStartDate(localDate);
    } else if (setStartDate) {
      setStartDate(undefined);
    }
  };

  const handleEndDateSelect = (date: Date | undefined) => {
    if (date && setEndDate) {
      // Yerel saat diliminde yeni bir tarih oluştur (timezone kaymasını önlemek için)
      const year = date.getFullYear();
      const month = date.getMonth();
      const day = date.getDate();
      const localDate = new Date(year, month, day, 23, 59, 59, 999);
      setEndDate(localDate);
    } else if (setEndDate) {
      setEndDate(undefined);
    }
  };

  if (!setStartDate || !setEndDate) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Calendar className="h-4 w-4 text-muted-foreground" />
      <DatePicker
        date={startDate}
        onSelect={handleStartDateSelect}
        placeholder="Başlangıç"
      />
      <span className="text-muted-foreground text-sm">-</span>
      <DatePicker
        date={endDate}
        onSelect={handleEndDateSelect}
        placeholder="Bitiş"
      />
    </div>
  );
};

export default DateRangeFilter;
