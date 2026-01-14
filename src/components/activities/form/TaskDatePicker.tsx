
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { UseFormReturn } from "react-hook-form";
import { format } from "date-fns";
import { EnhancedDatePicker } from "@/components/ui/enhanced-date-picker";

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
          <FormControl>
            <EnhancedDatePicker
              date={field.value ? new Date(field.value) : undefined}
              onSelect={(date) => {
                field.onChange(date ? format(date, 'yyyy-MM-dd') : '');
              }}
              placeholder="Tarih Seçin"
              className="w-full"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default TaskDatePicker;
