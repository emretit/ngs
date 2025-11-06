
import { 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { UseFormReturn } from "react-hook-form";
import { ProductFormSchema } from "../ProductFormSchema";

interface VatIncludedSwitchProps {
  form: UseFormReturn<ProductFormSchema>;
}

const VatIncludedSwitch = ({ form }: VatIncludedSwitchProps) => {
  return (
    <FormField
      control={form.control}
      name="vat_included"
      render={({ field }) => (
        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 bg-gray-50">
          <div className="space-y-0.5">
            <FormLabel className="text-sm font-medium">
              KDV Dahil Mi?
            </FormLabel>
            <p className="text-xs text-muted-foreground">
              Satış fiyatı KDV dahil mi?
            </p>
          </div>
          <FormControl>
            <Switch
              checked={Boolean(field.value)}
              onCheckedChange={field.onChange}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default VatIncludedSwitch;

