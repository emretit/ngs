
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Control } from "react-hook-form";

interface AddressSectionProps {
  control: Control<any>;
}

export const AddressSection = ({ control }: AddressSectionProps) => {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Adres Bilgileri</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <FormField
            control={control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Adres</FormLabel>
                <FormControl>
                  <Textarea placeholder="Adres bilgisi" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={control}
          name="country"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ülke</FormLabel>
              <FormControl>
                <Input placeholder="Ülke" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="city"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Şehir</FormLabel>
              <FormControl>
                <Input placeholder="Şehir" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="district"
          render={({ field }) => (
            <FormItem>
              <FormLabel>İlçe</FormLabel>
              <FormControl>
                <Input placeholder="İlçe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="postal_code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Posta Kodu</FormLabel>
              <FormControl>
                <Input placeholder="Posta kodu" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};
