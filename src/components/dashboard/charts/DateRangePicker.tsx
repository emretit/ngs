import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
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
  const [showStartCalendar, setShowStartCalendar] = useState(false);
  const [showEndCalendar, setShowEndCalendar] = useState(false);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Başlangıç Tarihi */}
      <Popover open={showStartCalendar} onOpenChange={setShowStartCalendar}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-8 gap-2 text-xs font-normal",
              !startDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="h-3.5 w-3.5" />
            {startDate ? format(startDate, "dd MMM yyyy", { locale: tr }) : "Başlangıç"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={startDate}
            onSelect={(date) => {
              onStartDateChange(date);
              setShowStartCalendar(false);
            }}
            initialFocus
            locale={tr}
          />
        </PopoverContent>
      </Popover>

      <span className="text-xs text-muted-foreground">-</span>

      {/* Bitiş Tarihi */}
      <Popover open={showEndCalendar} onOpenChange={setShowEndCalendar}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-8 gap-2 text-xs font-normal",
              !endDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="h-3.5 w-3.5" />
            {endDate ? format(endDate, "dd MMM yyyy", { locale: tr }) : "Bitiş"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={endDate}
            onSelect={(date) => {
              onEndDateChange(date);
              setShowEndCalendar(false);
            }}
            disabled={(date) => startDate ? date < startDate : false}
            initialFocus
            locale={tr}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};

