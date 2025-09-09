
import { 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { UseFormReturn } from "react-hook-form";
import { ProductFormSchema } from "./ProductFormSchema";
import CategorySelect from "./CategorySelect";

interface ProductGeneralSectionProps {
  form: UseFormReturn<ProductFormSchema>;
}

const ProductGeneralSection = ({ form }: ProductGeneralSectionProps) => {

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ürün Adı *</FormLabel>
              <FormControl>
                <Input placeholder="Ürün adı giriniz" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="sku"
            render={({ field }) => (
              <FormItem>
                <FormLabel>SKU (Stok Kodu)</FormLabel>
                <FormControl>
                  <Input placeholder="SKU giriniz" {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <CategorySelect form={form} />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Açıklama</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Ürün açıklaması giriniz"
                  className="resize-none min-h-[120px]"
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};

export default ProductGeneralSection;
