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
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3 pointer-events-auto", className)}
      weekStartsOn={1}
      locale={tr}
      captionLayout="dropdown"
      fromYear={2020}
      toYear={2040}
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
        Chevron: ({ orientation }) => 
          orientation === 'left' ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />,
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