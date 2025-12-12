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
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMonthSelect = (monthIndex: number) => {
    const newDate = setMonth(currentMonth, monthIndex);
    onMonthChange(newDate);
    setShowMonthPicker(false);
  };

  const handleYearSelect = (year: number) => {
    const newDate = setYear(currentMonth, year);
    onMonthChange(newDate);
    setShowYearPicker(false);
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
    <div className="flex items-center justify-between px-1 pt-1 pb-3">
      {/* Prev Button */}
      <button
        onClick={handlePrevMonth}
        className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/80 transition-all duration-200 active:scale-95"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {/* Month & Year Selectors */}
      <div className="flex items-center gap-1">
        {/* Month Selector */}
        <div className="relative" ref={monthRef}>
          <button
            onClick={() => {
              setShowMonthPicker(!showMonthPicker);
              setShowYearPicker(false);
            }}
            className={cn(
              "px-3 py-1.5 text-sm font-semibold rounded-lg transition-all duration-200",
              "hover:bg-primary/10 hover:text-primary",
              showMonthPicker && "bg-primary/10 text-primary"
            )}
          >
            {MONTHS[selectedMonth]}
          </button>
          
          {showMonthPicker && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-[9999] animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200 pointer-events-auto">
              <div className="bg-popover/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-2xl shadow-black/20 p-2 grid grid-cols-3 gap-1 min-w-[200px]">
                {MONTHS.map((month, index) => (
                  <button
                    key={month}
                    onClick={() => handleMonthSelect(index)}
                    className={cn(
                      "px-2 py-2 text-xs font-medium rounded-lg transition-all duration-150",
                      "hover:bg-primary/15 hover:text-primary hover:scale-105",
                      selectedMonth === index 
                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/30" 
                        : "text-foreground/80"
                    )}
                  >
                    {month.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Year Selector */}
        <div className="relative" ref={yearRef}>
          <button
            onClick={() => {
              setShowYearPicker(!showYearPicker);
              setShowMonthPicker(false);
            }}
            className={cn(
              "px-3 py-1.5 text-sm font-semibold rounded-lg transition-all duration-200",
              "hover:bg-primary/10 hover:text-primary",
              showYearPicker && "bg-primary/10 text-primary"
            )}
          >
            {selectedYear}
          </button>
          
          {showYearPicker && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-[9999] animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200 pointer-events-auto">
              <div className="bg-popover/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-2xl shadow-black/20 p-2 max-h-[240px] overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                <div className="grid grid-cols-4 gap-1 min-w-[180px]">
                  {YEARS.map((year) => (
                    <button
                      key={year}
                      onClick={() => handleYearSelect(year)}
                      className={cn(
                        "px-2 py-2 text-xs font-medium rounded-lg transition-all duration-150",
                        "hover:bg-primary/15 hover:text-primary hover:scale-105",
                        selectedYear === year 
                          ? "bg-primary text-primary-foreground shadow-md shadow-primary/30" 
                          : "text-foreground/80"
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
        onClick={handleNextMonth}
        className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/80 transition-all duration-200 active:scale-95"
      >
        <ChevronRight className="h-4 w-4" />
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
    <div className={cn("p-3", className)}>
      {/* Custom Month/Year Header */}
      <MonthYearSelector
        currentMonth={currentMonth}
        onMonthChange={setCurrentMonth}
      />
      
      {/* Calendar Grid */}
      <DayPicker
        mode="single"
        showOutsideDays={showOutsideDays}
        className="pointer-events-auto"
        weekStartsOn={1}
        locale={tr}
        month={currentMonth}
        onMonthChange={setCurrentMonth}
        selected={selected}
        onSelect={onSelect}
        disabled={disabled}
        classNames={{
          months: "flex flex-col",
          month: "space-y-2",
          caption: "hidden",
          nav: "hidden",
          month_grid: "w-full border-collapse",
          weekdays: "flex w-full mb-1",
          weekday: cn(
            "text-muted-foreground/70 font-medium text-[11px] uppercase tracking-wider",
            "h-8 w-10 flex items-center justify-center"
          ),
          week: "flex w-full",
          day: cn(
            "relative p-0.5 text-center text-sm focus-within:relative focus-within:z-20",
            "h-10 w-10 flex items-center justify-center",
            "[&:has([aria-selected])]:bg-transparent"
          ),
          day_button: cn(
            "h-9 w-9 p-0 font-medium rounded-lg",
            "inline-flex items-center justify-center",
            "transition-all duration-200 ease-out",
            "hover:bg-primary/10 hover:text-primary hover:scale-110",
            "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-1",
            "aria-selected:opacity-100"
          ),
          range_end: "day-range-end",
          selected: cn(
            "bg-gradient-to-br from-primary to-primary/80",
            "text-primary-foreground font-semibold",
            "shadow-lg shadow-primary/25",
            "hover:from-primary hover:to-primary/90 hover:text-primary-foreground hover:scale-110",
            "focus:from-primary focus:to-primary/90 focus:text-primary-foreground"
          ),
          today: cn(
            "relative font-semibold text-primary",
            "before:absolute before:inset-0 before:rounded-lg before:border-2 before:border-primary/40",
            "before:animate-pulse"
          ),
          outside: cn(
            "text-muted-foreground/40 opacity-60",
            "hover:bg-muted/50 hover:text-muted-foreground/60",
            "aria-selected:bg-accent/30 aria-selected:text-muted-foreground/50"
          ),
          disabled: "text-muted-foreground/30 opacity-40 cursor-not-allowed hover:bg-transparent hover:scale-100",
          range_middle: "aria-selected:bg-accent/20 aria-selected:text-accent-foreground",
          hidden: "invisible",
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
            "w-full h-8 justify-between text-left font-normal text-xs",
            "border-border/50 hover:border-primary/50 hover:bg-accent/30",
            "transition-all duration-200",
            "group",
            !date && "text-muted-foreground",
            className
          )}
          disabled={isButtonDisabled}
        >
          <span className="truncate text-left flex-1">
            {date ? format(date, "dd MMMM yyyy", { locale: tr }) : placeholder}
          </span>
          <CalendarIcon className="ml-2 h-4 w-4 shrink-0 opacity-50 group-hover:opacity-80 transition-opacity" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className={cn(
          "w-auto p-0",
          "bg-popover/95 backdrop-blur-xl",
          "border-border/50",
          "shadow-2xl shadow-black/20",
          "rounded-xl",
          "z-[9999] pointer-events-auto"
        )} 
        align="start"
        sideOffset={8}
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
