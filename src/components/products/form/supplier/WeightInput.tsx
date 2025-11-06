
import { 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage,
  FormDescription
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { ProductFormSchema } from "../ProductFormSchema";

interface WeightInputProps {
  form: UseFormReturn<ProductFormSchema>;
}

const WeightInput = ({ form }: WeightInputProps) => {
  return (
    <FormField
      control={form.control}
      name="weight"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs font-medium text-gray-700 mb-1.5 block">Ağırlık</FormLabel>
          <FormControl>
            <Input 
              type="number" 
              min="0" 
              step="0.01"
              placeholder="0"
              className="h-7 text-xs"
              {...field}
              value={field.value ?? ''}
              onChange={(e) => {
                const value = e.target.value;
                field.onChange(value === '' ? null : parseFloat(value) || null);
              }}
            />
          </FormControl>
          <FormDescription className="text-xs text-gray-500">
            Ürünün ağırlığı (isteğe bağlı)
          </FormDescription>
          <FormMessage className="text-xs" />
        </FormItem>
      )}
    />
  );
};

export default WeightInput;

