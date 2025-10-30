import * as React from "react";
import { format, addMonths, subMonths, addYears, subYears } from "date-fns";
import { tr } from "date-fns/locale";
import { CalendarIcon, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

interface DatePickerProps {
  date?: Date;
  onSelect?: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean | ((date: Date) => boolean);
}

function EnhancedCalendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(props.month || new Date());
  const [showMonthPicker, setShowMonthPicker] = React.useState(false);
  const [showYearPicker, setShowYearPicker] = React.useState(false);

  const handleMonthChange = (month: number, year: number, closePicker: boolean = true) => {
    const newDate = new Date(year, month);
    setCurrentMonth(newDate);
    if (closePicker) {
      setShowMonthPicker(false);
      setShowYearPicker(false);
    }
    if (props.onMonthChange) {
      props.onMonthChange(newDate);
    }
  };

  const months = [
    "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
    "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
  ];

  const currentYear = currentMonth.getFullYear();
  const currentMonthIndex = currentMonth.getMonth();

  // Generate year options (2020 to 2040)
  const yearOptions = Array.from({ length: 21 }, (_, i) => 2020 + i);

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3 pointer-events-auto", className)}
      month={currentMonth}
      onMonthChange={setCurrentMonth}
      weekStartsOn={1}
      locale={tr}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center mb-2",
        caption_label: "text-sm font-medium hidden", // Hide default caption
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-8 w-8 bg-transparent p-0 opacity-60 hover:opacity-100 hover:bg-primary/10 transition-all"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-muted-foreground rounded-md w-11 font-medium text-[0.85rem]",
        row: "flex w-full mt-2",
        cell: "h-11 w-11 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-11 w-11 p-0 font-medium text-base aria-selected:opacity-100 hover:bg-primary/10 hover:scale-110 transition-all duration-200"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary/90 text-white hover:bg-primary hover:text-white focus:bg-primary focus:text-white rounded-full font-semibold shadow-sm",
        day_today: "bg-primary/5 text-foreground font-semibold border-2 border-primary/30 rounded-full",
        day_outside:
          "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent/20 aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ..._props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ..._props }) => <ChevronRight className="h-4 w-4" />,
        Caption: ({ displayMonth }) => (
          <div className="relative w-full">
            <div className="flex items-center justify-between w-full px-1 gap-2">
              {/* Yıl Geri Butonu */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleMonthChange(displayMonth.getMonth(), displayMonth.getFullYear() - 1, true);
                }}
                className="h-8 w-8 p-0 opacity-60 hover:opacity-100 hover:bg-primary/10 rounded transition-all flex items-center justify-center shrink-0"
                title="Önceki yıl"
              >
                <ChevronsLeft className="h-4 w-4" />
              </button>

              {/* Ay Geri Butonu */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  const newDate = subMonths(displayMonth, 1);
                  handleMonthChange(newDate.getMonth(), newDate.getFullYear(), true);
                }}
                className="h-8 w-8 p-0 opacity-60 hover:opacity-100 hover:bg-primary/10 rounded transition-all flex items-center justify-center shrink-0"
                title="Önceki ay"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {/* Ay Seçici */}
              <button
                onClick={() => {
                  setShowMonthPicker(!showMonthPicker);
                  setShowYearPicker(false);
                }}
                className="px-3 py-1.5 text-sm font-medium hover:bg-gray-50 rounded transition-colors"
              >
                {months[displayMonth.getMonth()]}
              </button>

              {/* Yıl Seçici */}
              <button
                onClick={() => {
                  setShowYearPicker(!showYearPicker);
                  setShowMonthPicker(false);
                }}
                className="px-3 py-1.5 text-sm font-medium hover:bg-gray-50 rounded transition-colors"
              >
                {displayMonth.getFullYear()}
              </button>

              {/* Ay İleri Butonu */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  const newDate = addMonths(displayMonth, 1);
                  handleMonthChange(newDate.getMonth(), newDate.getFullYear(), true);
                }}
                className="h-8 w-8 p-0 opacity-60 hover:opacity-100 hover:bg-primary/10 rounded transition-all flex items-center justify-center shrink-0"
                title="Sonraki ay"
              >
                <ChevronRight className="h-4 w-4" />
              </button>

              {/* Yıl İleri Butonu */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleMonthChange(displayMonth.getMonth(), displayMonth.getFullYear() + 1, true);
                }}
                className="h-8 w-8 p-0 opacity-60 hover:opacity-100 hover:bg-primary/10 rounded transition-all flex items-center justify-center shrink-0"
                title="Sonraki yıl"
              >
                <ChevronsRight className="h-4 w-4" />
              </button>
            </div>

            {/* Ay Seçim Popup */}
            {showMonthPicker && (
              <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white border rounded-lg shadow-lg p-3">
                <div className="grid grid-cols-3 gap-2">
                  {months.map((month, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        handleMonthChange(index, displayMonth.getFullYear(), true);
                      }}
                      className={cn(
                        "p-2.5 text-sm rounded-md transition-all font-medium",
                        index === displayMonth.getMonth()
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-gray-700 hover:bg-gray-100 hover:scale-105"
                      )}
                    >
                      {month}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Yıl Seçim Popup */}
            {showYearPicker && (
              <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white border rounded-lg shadow-lg p-3">
                <div className="max-h-64 overflow-y-auto">
                  <div className="grid grid-cols-3 gap-2">
                    {yearOptions.map((year) => (
                      <button
                        key={year}
                        onClick={() => {
                          handleMonthChange(displayMonth.getMonth(), year, true);
                        }}
                        className={cn(
                          "p-2.5 text-sm rounded-md transition-all font-medium",
                          year === displayMonth.getFullYear()
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-gray-700 hover:bg-gray-100 hover:scale-105"
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
        ),
      }}
      {...props}
    />
  );
}

export function EnhancedDatePicker({ date, onSelect, placeholder = "Tarih seçin", className, disabled }: DatePickerProps) {
  const isButtonDisabled = typeof disabled === 'boolean' ? disabled : false;
  const calendarDisabled = typeof disabled === 'function' ? disabled : undefined;
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full h-8 justify-between text-left font-normal text-sm",
            !date && "text-muted-foreground",
            className
          )}
          disabled={isButtonDisabled}
        >
          <span className="truncate text-left flex-1">
            {date ? format(date, "dd MMMM yyyy", { locale: tr }) : placeholder}
          </span>
          <CalendarIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <EnhancedCalendar
          mode="single"
          selected={date}
          onSelect={onSelect}
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