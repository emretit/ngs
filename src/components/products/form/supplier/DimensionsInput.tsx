
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

interface DimensionsInputProps {
  form: UseFormReturn<ProductFormSchema>;
}

const DimensionsInput = ({ form }: DimensionsInputProps) => {
  return (
    <FormField
      control={form.control}
      name="dimensions"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs font-medium text-gray-700 mb-1.5 block">Boyutlar</FormLabel>
          <FormControl>
            <Input 
              placeholder="Boyut giriniz"
              className="h-7 text-xs"
              {...field}
              value={field.value ?? ''}
            />
          </FormControl>
          <FormDescription className="text-xs text-gray-500">
            Ürünün boyutları (isteğe bağlı)
          </FormDescription>
          <FormMessage className="text-xs" />
        </FormItem>
      )}
    />
  );
};

export default DimensionsInput;

