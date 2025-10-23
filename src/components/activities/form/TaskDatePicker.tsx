
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface TaskDatePickerProps {
  form: UseFormReturn<any>;
  defaultValue?: string;
}

const TaskDatePicker = ({ form, defaultValue }: TaskDatePickerProps) => {
  return (
    <FormField
      control={form.control}
      name="due_date"
      render={({ field }) => (
        <FormItem className="flex flex-col">
          <FormLabel className="text-xs font-medium text-gray-700">Son Tarih</FormLabel>
          <Popover>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full h-8 px-3 py-2 text-xs text-left font-normal justify-start",
                    !field.value && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-3.5 w-3.5 opacity-50" />
                  {field.value ? (
                    format(new Date(field.value), "dd MMMM yyyy", { locale: tr })
                  ) : (
                    <span>Tarih Seçin</span>
                  )}
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={field.value ? new Date(field.value) : undefined}
                onSelect={(date) => {
                  field.onChange(date ? format(date, 'yyyy-MM-dd') : '');
                }}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
                locale={tr}
              />
            </PopoverContent>
          </Popover>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default TaskDatePicker;
