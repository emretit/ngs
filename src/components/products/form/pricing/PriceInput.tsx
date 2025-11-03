
import { 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage,
  FormDescription
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { UseFormReturn } from "react-hook-form";
import { ProductFormSchema } from "../ProductFormSchema";

interface PriceInputProps {
  form: UseFormReturn<ProductFormSchema>;
  name: "price" | "purchase_price";
  label: string;
  description?: string;
  isRequired?: boolean;
  showVatToggle?: boolean;
}

const PriceInput = ({ form, name, label, description, isRequired = false, showVatToggle = false }: PriceInputProps) => {
  const getVatToggleFieldName = () => {
    if (name === 'price') return 'price_includes_vat';
    if (name === 'purchase_price') return 'purchase_price_includes_vat';
    return null;
  };

  const vatToggleFieldName = getVatToggleFieldName();

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs font-medium text-gray-700 mb-1.5 block">{label}{isRequired && " *"}</FormLabel>
          <div className="space-y-3">
            <FormControl>
              <Input 
                type="number" 
                min="0" 
                step="0.01"
                className="h-7 text-xs"
                {...field}
                value={field.value || ''}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  field.onChange(isNaN(value) ? 0 : value);
                }}
              />
            </FormControl>
            
            {showVatToggle && vatToggleFieldName && (
              <FormField
                control={form.control}
                name={vatToggleFieldName as keyof ProductFormSchema}
                render={({ field: toggleField }) => (
                  <div className="flex flex-row items-center justify-between rounded-lg border p-3 bg-gray-50">
                    <FormLabel className="text-xs font-medium">
                      KDV Dahil Mi?
                    </FormLabel>
                    <FormControl>
                      <Switch
                        checked={Boolean(toggleField.value)}
                        onCheckedChange={toggleField.onChange}
                      />
                    </FormControl>
                  </div>
                )}
              />
            )}
          </div>
          {description && <FormDescription className="text-xs text-gray-500 mt-1">{description}</FormDescription>}
          <FormMessage className="text-xs" />
        </FormItem>
      )}
    />
  );
};

export default PriceInput;
