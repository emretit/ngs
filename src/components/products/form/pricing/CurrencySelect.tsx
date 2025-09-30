
import { 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { UseFormReturn, useWatch } from "react-hook-form";
import { ProductFormSchema } from "../ProductFormSchema";
import { useEffect } from "react";
import { getCurrentExchangeRates } from "@/components/proposals/form/items/utils/currencyUtils";
import CurrencyDropdown from "@/components/shared/CurrencyDropdown";

interface CurrencySelectProps {
  form: UseFormReturn<ProductFormSchema>;
}

const CurrencySelect = ({ form }: CurrencySelectProps) => {
  const selectedCurrency = useWatch({
    control: form.control,
    name: "currency",
    defaultValue: "TRY"
  });

  // Update exchange rate when currency changes
  useEffect(() => {
    if (selectedCurrency && selectedCurrency !== "TRY") {
      const rates = getCurrentExchangeRates();
      form.setValue("exchange_rate", rates[selectedCurrency] || 1);
    } else {
      form.setValue("exchange_rate", undefined);
    }
  }, [selectedCurrency, form]);

  const currencyOptions = [
    { value: "TRY", label: "Türk Lirası (TRY)", symbol: "₺" },
    { value: "USD", label: "Amerikan Doları (USD)", symbol: "$" },
    { value: "EUR", label: "Euro (EUR)", symbol: "€" },
    { value: "GBP", label: "İngiliz Sterlini (GBP)", symbol: "£" }
  ];

  return (
    <div className="space-y-1">
      <FormField
        control={form.control}
        name="currency"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs font-medium text-gray-700 mb-1.5 block">Para Birimi</FormLabel>
            <FormControl>
              <CurrencyDropdown
                value={field.value || "TRY"}
                onValueChange={field.onChange}
                currencyOptions={currencyOptions}
              />
            </FormControl>
            <FormMessage className="text-xs" />
          </FormItem>
        )}
      />
      
    </div>
  );
};

export default CurrencySelect;
