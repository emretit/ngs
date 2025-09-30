
import { 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { ProductFormSchema } from "../ProductFormSchema";

interface BarcodeInputProps {
  form: UseFormReturn<ProductFormSchema>;
}

const BarcodeInput = ({ form }: BarcodeInputProps) => {
  return (
    <FormField
      control={form.control}
      name="barcode"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs font-medium text-gray-700 mb-1.5 block">Barkod</FormLabel>
          <FormControl>
            <Input 
              placeholder="Barkod giriniz (isteğe bağlı)" 
              className="h-9 text-sm"
              {...field} 
              value={field.value || ''}
            />
          </FormControl>
          <FormMessage className="text-xs" />
        </FormItem>
      )}
    />
  );
};

export default BarcodeInput;
