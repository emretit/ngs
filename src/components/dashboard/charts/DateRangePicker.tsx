import { EnhancedDatePicker } from "@/components/ui/enhanced-date-picker";
import { cn } from "@/lib/utils";

interface DateRangePickerProps {
  startDate?: Date;
  endDate?: Date;
  onStartDateChange: (date: Date | undefined) => void;
  onEndDateChange: (date: Date | undefined) => void;
  className?: string;
}

export const DateRangePicker = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  className,
}: DateRangePickerProps) => {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Başlangıç Tarihi */}
      <EnhancedDatePicker
        date={startDate}
        onSelect={onStartDateChange}
        placeholder="Başlangıç"
        className="w-auto"
      />

      <span className="text-xs text-muted-foreground">-</span>

      {/* Bitiş Tarihi */}
      <EnhancedDatePicker
        date={endDate}
        onSelect={onEndDateChange}
        placeholder="Bitiş"
        disabled={(date) => startDate ? date < startDate : false}
        className="w-auto"
      />
    </div>
  );
};

