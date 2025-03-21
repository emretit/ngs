
import { 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
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

interface TaxRateSelectProps {
  form: UseFormReturn<ProductFormSchema>;
}

const TaxRateSelect = ({ form }: TaxRateSelectProps) => {
  return (
    <FormField
      control={form.control}
      name="tax_rate"
      render={({ field }) => (
        <FormItem>
          <FormLabel>KDV Oranı</FormLabel>
          <Select
            onValueChange={(value) => field.onChange(parseInt(value))}
            value={field.value.toString()}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="KDV oranı seçiniz" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value="0">%0</SelectItem>
              <SelectItem value="1">%1</SelectItem>
              <SelectItem value="8">%8</SelectItem>
              <SelectItem value="10">%10</SelectItem>
              <SelectItem value="18">%18</SelectItem>
              <SelectItem value="20">%20</SelectItem>
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default TaxRateSelect;
