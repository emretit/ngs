
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
        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <FormLabel className="text-base">Ürün Durumu</FormLabel>
            <FormDescription>
              Bu ürün aktif olarak satışta mı?
            </FormDescription>
          </div>
          <FormControl>
            <Switch
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          </FormControl>
        </FormItem>
      )}
    />
  );
};

export default ProductStatusSwitch;
