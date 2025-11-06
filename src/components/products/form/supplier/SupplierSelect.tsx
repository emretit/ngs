
import { 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage,
  FormDescription
} from "@/components/ui/form";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";
import { ProductFormSchema } from "../ProductFormSchema";
import { useSupplierOptions } from "./useSupplierOptions";

interface SupplierSelectProps {
  form: UseFormReturn<ProductFormSchema>;
}

const SupplierSelect = ({ form }: SupplierSelectProps) => {
  const { data: suppliers } = useSupplierOptions();

  return (
    <FormField
      control={form.control}
      name="supplier_id"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs font-medium text-gray-700 mb-1.5 block">Tedarikçi</FormLabel>
          <Select
            onValueChange={field.onChange}
            value={field.value || "none"}
          >
            <FormControl>
              <SelectTrigger className="h-7 text-xs">
                <SelectValue placeholder="Tedarikçi seçiniz" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value="none">Seçilmedi</SelectItem>
              {suppliers?.map((supplier) => (
                <SelectItem key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormDescription className="text-xs text-gray-500 mt-1">
            Bu ürünü sağlayan tedarikçiyi seçin
          </FormDescription>
          <FormMessage className="text-xs" />
        </FormItem>
      )}
    />
  );
};

export default SupplierSelect;
