import { UseFormReturn } from "react-hook-form";
import { ProductFormSchema } from "../ProductFormSchema";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useWatch } from "react-hook-form";

interface DiscountRateInputProps {
  form: UseFormReturn<ProductFormSchema>;
}

const DiscountRateInput = ({ form }: DiscountRateInputProps) => {
  const discountRate = useWatch({
    control: form.control,
    name: "discount_rate",
    defaultValue: 0,
  });

  const price = useWatch({
    control: form.control,
    name: "price",
    defaultValue: 0,
  });

  // Calculate discount price based on rate and main price
  const discountPrice = discountRate > 0 && price > 0 
    ? price * (1 - discountRate / 100) 
    : null;

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="discount_rate"
        render={({ field }) => (
          <FormItem>
            <FormLabel>İndirim Oranı (%)</FormLabel>
            <FormControl>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.01"
                placeholder="0"
                {...field}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0;
                  field.onChange(value);
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      {discountRate > 0 && price > 0 && (
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-sm text-blue-800">
            <div className="flex justify-between">
              <span>Normal Fiyat:</span>
              <span className="font-medium">₺{price.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>İndirim Oranı:</span>
              <span className="font-medium">%{discountRate}</span>
            </div>
            <div className="flex justify-between">
              <span>İndirim Tutarı:</span>
              <span className="font-medium">₺{((price * discountRate) / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t border-blue-300 pt-2 mt-2">
              <span className="font-semibold">İndirimli Fiyat:</span>
              <span className="font-bold text-blue-900">₺{discountPrice?.toFixed(2) || ((price * (100 - discountRate)) / 100).toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiscountRateInput;
