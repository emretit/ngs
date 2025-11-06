
import { 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage,
  FormDescription
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { ProductFormSchema } from "../ProductFormSchema";

interface TagsInputProps {
  form: UseFormReturn<ProductFormSchema>;
}

const TagsInput = ({ form }: TagsInputProps) => {
  return (
    <FormField
      control={form.control}
      name="tags"
      render={({ field }) => {
        // Array'i string'e çevir (virgülle ayrılmış)
        const tagsValue = Array.isArray(field.value) 
          ? field.value.join(", ") 
          : (field.value || "");
        
        return (
          <FormItem>
            <FormLabel className="text-xs font-medium text-gray-700 mb-1.5 block">Etiketler</FormLabel>
            <FormControl>
              <Input 
                placeholder="Etiket giriniz"
                className="h-7 text-xs"
                value={tagsValue}
                onChange={(e) => {
                  const value = e.target.value;
                  // String olarak sakla, transform schema'da yapacak
                  field.onChange(value === '' ? null : value);
                }}
              />
            </FormControl>
            <FormDescription className="text-xs text-gray-500">
              Virgülle ayrılmış etiketler (isteğe bağlı)
            </FormDescription>
            <FormMessage className="text-xs" />
          </FormItem>
        );
      }}
    />
  );
};

export default TagsInput;

