
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

interface WarrantyPeriodInputProps {
  form: UseFormReturn<ProductFormSchema>;
}

const WarrantyPeriodInput = ({ form }: WarrantyPeriodInputProps) => {
  return (
    <FormField
      control={form.control}
      name="warranty_period"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs font-medium text-gray-700 mb-1.5 block">Garanti Süresi (Ay)</FormLabel>
          <FormControl>
            <Input 
              type="number" 
              min="0" 
              placeholder="0"
              className="h-7 text-xs"
              {...field}
              value={field.value ?? ''}
              onChange={(e) => {
                const value = e.target.value;
                field.onChange(value === '' ? null : parseInt(value) || null);
              }}
            />
          </FormControl>
          <FormDescription className="text-xs text-gray-500">
            Ürünün garanti süresi ay cinsinden (isteğe bağlı)
          </FormDescription>
          <FormMessage className="text-xs" />
        </FormItem>
      )}
    />
  );
};

export default WarrantyPeriodInput;

