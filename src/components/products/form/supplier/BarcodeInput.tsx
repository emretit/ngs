
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
          <FormLabel>Barkod</FormLabel>
          <FormControl>
            <Input 
              placeholder="Barkod giriniz (isteğe bağlı)" 
              {...field} 
              value={field.value || ''}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default BarcodeInput;
