
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Control } from "react-hook-form";

interface EmergencyContactSectionProps {
  control: Control<any>;
}

export const EmergencyContactSection = ({ control }: EmergencyContactSectionProps) => {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Acil Durum İletişim Bilgileri</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={control}
          name="emergency_contact_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>İletişim Kişisi</FormLabel>
              <FormControl>
                <Input placeholder="Acil durumda aranacak kişi" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="emergency_contact_relation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Yakınlık Derecesi</FormLabel>
              <FormControl>
                <Input placeholder="Yakınlık derecesi" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="emergency_contact_phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>İletişim Telefonu</FormLabel>
              <FormControl>
                <Input placeholder="Acil durum telefon numarası" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};
