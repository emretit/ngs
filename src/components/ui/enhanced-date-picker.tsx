import * as React from "react";
import { format, setMonth, setYear, getMonth, getYear } from "date-fns";
import { tr } from "date-fns/locale";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

interface DatePickerProps {
  date?: Date;
  onSelect?: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean | ((date: Date) => boolean);
}

const MONTHS = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
];

const YEARS = Array.from({ length: 25 }, (_, i) => 2020 + i);

function MonthYearSelector({ 
  currentMonth, 
  onMonthChange 
}: { 
  currentMonth: Date; 
  onMonthChange: (date: Date) => void;
}) {
  const [showMonthPicker, setShowMonthPicker] = React.useState(false);
  const [showYearPicker, setShowYearPicker] = React.useState(false);
  const monthRef = React.useRef<HTMLDivElement>(null);
  const yearRef = React.useRef<HTMLDivElement>(null);

  const selectedMonth = getMonth(currentMonth);
  const selectedYear = getYear(currentMonth);

  // Close dropdowns when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (monthRef.current && !monthRef.current.contains(event.target as Node)) {
        setShowMonthPicker(false);
      }
      if (yearRef.current && !yearRef.current.contains(event.target as Node)) {
        setShowYearPicker(false);
      }
    };
    
    if (showMonthPicker || showYearPicker) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showMonthPicker, showYearPicker]);

  const handleMonthSelect = (monthIndex: number) => {
    const newDate = setMonth(currentMonth, monthIndex);
    onMonthChange(newDate);
    // Küçük bir gecikme ile kapat (animasyon için)
    setTimeout(() => setShowMonthPicker(false), 100);
  };

  const handleYearSelect = (year: number) => {
    const newDate = setYear(currentMonth, year);
    onMonthChange(newDate);
    // Küçük bir gecikme ile kapat (animasyon için)
    setTimeout(() => setShowYearPicker(false), 100);
  };

  const handlePrevMonth = () => {
    const newMonth = selectedMonth === 0 ? 11 : selectedMonth - 1;
    const newYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear;
    onMonthChange(setMonth(setYear(currentMonth, newYear), newMonth));
  };

  const handleNextMonth = () => {
    const newMonth = selectedMonth === 11 ? 0 : selectedMonth + 1;
    const newYear = selectedMonth === 11 ? selectedYear + 1 : selectedYear;
    onMonthChange(setMonth(setYear(currentMonth, newYear), newMonth));
  };

  return (
    <div className="flex items-center justify-between px-3 py-2 border-b border-border/50">
      {/* Prev Button */}
      <button
        type="button"
        onClick={handlePrevMonth}
        className="h-9 w-9 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-150 active:scale-95"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      {/* Month & Year Selectors */}
      <div className="flex items-center gap-2">
        {/* Month Selector */}
        <div className="relative" ref={monthRef}>
          <button
            type="button"
            onClick={() => {
              setShowMonthPicker(!showMonthPicker);
              setShowYearPicker(false);
            }}
            className={cn(
              "px-4 py-2 text-sm font-semibold rounded-md transition-all duration-150",
              "hover:bg-accent/80 hover:text-foreground",
              "border border-transparent",
              showMonthPicker && "bg-accent text-foreground border-border"
            )}
          >
            {MONTHS[selectedMonth]}
          </button>
          
          {showMonthPicker && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 z-[99999] pointer-events-auto">
              <div className="bg-popover border border-border rounded-lg shadow-xl p-2 grid grid-cols-3 gap-1 min-w-[240px]">
                {MONTHS.map((month, index) => (
                  <button
                    key={month}
                    onClick={() => handleMonthSelect(index)}
                    type="button"
                    className={cn(
                      "px-3 py-2.5 text-xs font-medium rounded-md transition-all duration-100",
                      "hover:bg-accent hover:text-foreground",
                      selectedMonth === index 
                        ? "bg-primary text-primary-foreground font-semibold shadow-sm" 
                        : "text-foreground/70"
                    )}
                  >
                    {month}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Year Selector */}
        <div className="relative" ref={yearRef}>
          <button
            type="button"
            onClick={() => {
              setShowYearPicker(!showYearPicker);
              setShowMonthPicker(false);
            }}
            className={cn(
              "px-4 py-2 text-sm font-semibold rounded-md transition-all duration-150",
              "hover:bg-accent/80 hover:text-foreground",
              "border border-transparent",
              showYearPicker && "bg-accent text-foreground border-border"
            )}
          >
            {selectedYear}
          </button>
          
          {showYearPicker && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 z-[99999] pointer-events-auto">
              <div className="bg-popover border border-border rounded-lg shadow-xl p-2 max-h-[280px] overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                <div className="grid grid-cols-4 gap-1 min-w-[220px]">
                  {YEARS.map((year) => (
                    <button
                      key={year}
                      onClick={() => handleYearSelect(year)}
                      type="button"
                      className={cn(
                        "px-3 py-2.5 text-xs font-medium rounded-md transition-all duration-100",
                        "hover:bg-accent hover:text-foreground",
                        selectedYear === year 
                          ? "bg-primary text-primary-foreground font-semibold shadow-sm" 
                          : "text-foreground/70"
                      )}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Next Button */}
      <button
        type="button"
        onClick={handleNextMonth}
        className="h-9 w-9 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-150 active:scale-95"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}

interface EnhancedCalendarProps {
  className?: string;
  classNames?: CalendarProps["classNames"];
  showOutsideDays?: boolean;
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
  disabled?: (date: Date) => boolean;
  initialFocus?: boolean;
  mode?: "single";
}

function EnhancedCalendar({
  className,
  classNames: customClassNames,
  showOutsideDays = true,
  selected,
  onSelect,
  disabled,
  mode = "single",
  ...props
}: EnhancedCalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState<Date>(
    selected instanceof Date ? selected : new Date()
  );

  return (
    <div className={cn("pb-3", className)}>
      {/* Custom Month/Year Header */}
      <MonthYearSelector
        currentMonth={currentMonth}
        onMonthChange={setCurrentMonth}
      />
      
      {/* Calendar Grid */}
      <DayPicker
        mode="single"
        showOutsideDays={showOutsideDays}
        className="pointer-events-auto px-3 pt-2"
        weekStartsOn={1}
        locale={tr}
        month={currentMonth}
        onMonthChange={setCurrentMonth}
        selected={selected}
        onSelect={onSelect}
        disabled={disabled}
        formatters={{
          formatWeekdayName: (date) => {
            const weekdays = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
            return weekdays[date.getDay() === 0 ? 6 : date.getDay() - 1];
          }
        }}
        classNames={{
          months: "flex flex-col",
          month: "space-y-3",
          caption: "hidden",
          nav: "hidden",
          table: "w-full border-collapse border-spacing-0",
          head_row: "flex mb-1",
          head_cell: cn(
            "text-muted-foreground/60 w-10 h-8 font-semibold text-[11px] uppercase tracking-wide",
            "flex items-center justify-center"
          ),
          row: "flex w-full mt-0.5",
          cell: cn(
            "relative p-0 text-center text-sm",
            "[&:has([aria-selected])]:bg-transparent"
          ),
          day: cn(
            "h-10 w-10 p-0 font-normal rounded-md text-sm",
            "inline-flex items-center justify-center",
            "transition-colors duration-100",
            "hover:bg-accent hover:text-accent-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            "aria-selected:opacity-100"
          ),
          day_range_end: "day-range-end",
          day_selected: cn(
            "bg-primary text-primary-foreground font-semibold",
            "hover:bg-primary hover:text-primary-foreground",
            "focus:bg-primary focus:text-primary-foreground"
          ),
          day_today: cn(
            "bg-accent/50 font-semibold",
            "aria-selected:bg-primary aria-selected:text-primary-foreground"
          ),
          day_outside: cn(
            "text-muted-foreground/40",
            "hover:bg-accent/50 hover:text-muted-foreground/60",
            "aria-selected:bg-accent/30 aria-selected:text-muted-foreground"
          ),
          day_disabled: "text-muted-foreground/30 opacity-40 cursor-not-allowed hover:bg-transparent",
          day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
          day_hidden: "invisible",
          ...customClassNames,
        }}
      />
    </div>
  );
}

export function EnhancedDatePicker({ 
  date, 
  onSelect, 
  placeholder = "Tarih seçin", 
  className, 
  disabled 
}: DatePickerProps) {
  const isButtonDisabled = typeof disabled === 'boolean' ? disabled : false;
  const calendarDisabled = typeof disabled === 'function' ? disabled : undefined;
  const [open, setOpen] = React.useState(false);
  
  // Gün seçildiğinde dialog'u kapat, ay/yıl seçiminde kapatma
  const handleDateSelect = (selectedDate: Date | undefined) => {
    onSelect?.(selectedDate);
    // Sadece gün seçildiğinde (date değeri geldiğinde) dialog'u kapat
    if (selectedDate) {
      setOpen(false);
    }
  };
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full h-9 justify-between text-left font-normal text-xs",
            "border-border hover:border-primary/50 hover:bg-accent/50",
            "transition-all duration-200",
            "group",
            !date && "text-muted-foreground",
            className
          )}
          disabled={isButtonDisabled}
        >
          <span className="truncate text-left flex-1 text-sm">
            {date ? format(date, "dd MMM yyyy", { locale: tr }) : placeholder}
          </span>
          <CalendarIcon className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className={cn(
          "w-auto p-0",
          "bg-popover backdrop-blur-xl",
          "border-2 border-border",
          "shadow-2xl",
          "rounded-xl",
          "z-[9999] pointer-events-auto"
        )} 
        align="start"
        sideOffset={4}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <EnhancedCalendar
          mode="single"
          selected={date}
          onSelect={handleDateSelect}
          disabled={calendarDisabled}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

EnhancedCalendar.displayName = "EnhancedCalendar";
EnhancedDatePicker.displayName = "EnhancedDatePicker";

export { EnhancedCalendar };
