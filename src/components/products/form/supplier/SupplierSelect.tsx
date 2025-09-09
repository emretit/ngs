
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
          <FormLabel>Tedarikçi</FormLabel>
          <Select
            onValueChange={field.onChange}
            value={field.value || "none"}
          >
            <FormControl>
              <SelectTrigger>
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
          <FormDescription>
            Bu ürünü sağlayan tedarikçiyi seçin
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default SupplierSelect;
