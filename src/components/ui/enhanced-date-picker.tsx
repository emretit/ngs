import * as React from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
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
  const [showMonthYearPicker, setShowMonthYearPicker] = React.useState(false);

  const handleMonthChange = (month: number, year: number) => {
    const newDate = new Date(year, month);
    setCurrentMonth(newDate);
    setShowMonthYearPicker(false);
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

  // Generate year options (50 years back and 10 years forward)
  const yearOptions = Array.from({ length: 61 }, (_, i) => currentYear - 50 + i);

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3 pointer-events-auto", className)}
      month={currentMonth}
      onMonthChange={setCurrentMonth}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium hidden", // Hide default caption
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-[#FCE4EC]"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent/10 text-accent font-semibold",
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
          <div className="relative">
            {!showMonthYearPicker ? (
              <button
                onClick={() => setShowMonthYearPicker(true)}
                className="flex justify-center items-center w-full py-2 text-sm font-medium hover:bg-gray-50 rounded transition-colors"
              >
                {months[displayMonth.getMonth()]} {displayMonth.getFullYear()}
              </button>
            ) : (
              <div className="absolute top-0 left-0 right-0 z-50 bg-white border rounded-lg shadow-lg p-4">
                <div className="space-y-3">
                  {/* Year Selection */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Yıl</label>
                    <Select
                      value={displayMonth.getFullYear().toString()}
                      onValueChange={(year) => handleMonthChange(displayMonth.getMonth(), parseInt(year))}
                    >
                      <SelectTrigger className="w-full h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-48">
                        {yearOptions.map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Month Grid */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">Ay</label>
                    <div className="grid grid-cols-3 gap-2">
                      {months.map((month, index) => (
                        <button
                          key={index}
                          onClick={() => handleMonthChange(index, displayMonth.getFullYear())}
                          className={cn(
                            "p-2 text-xs rounded hover:bg-gray-100 transition-colors",
                            index === displayMonth.getMonth()
                              ? "bg-primary text-primary-foreground"
                              : "text-gray-700"
                          )}
                        >
                          {month}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowMonthYearPicker(false)}
                      className="text-xs"
                    >
                      Kapat
                    </Button>
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
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
          disabled={isButtonDisabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "dd MMMM yyyy", { locale: tr }) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <EnhancedCalendar
          mode="single"
          selected={date}
          onSelect={onSelect}
          disabled={disabled}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

EnhancedCalendar.displayName = "EnhancedCalendar";
EnhancedDatePicker.displayName = "EnhancedDatePicker";

export { EnhancedCalendar };