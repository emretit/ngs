
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { UseFormReturn } from "react-hook-form";
import { ProductFormSchema } from "../ProductFormSchema";

interface ProductStatusSwitchProps {
  form: UseFormReturn<ProductFormSchema>;
}

const ProductStatusSwitch = ({ form }: ProductStatusSwitchProps) => {
  return (
    <FormField
      control={form.control}
      name="is_active"
      render={({ field }) => (
        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-2">
          <FormLabel className="text-xs font-medium text-gray-700 mr-3">Aktif</FormLabel>
          <FormControl>
            <Switch
              checked={field.value}
              onCheckedChange={(checked) => {
                field.onChange(checked);
                // is_active değiştiğinde status alanını da güncelle
                form.setValue("status", checked ? "active" : "inactive");
              }}
            />
          </FormControl>
        </FormItem>
      )}
    />
  );
};

export default ProductStatusSwitch;
