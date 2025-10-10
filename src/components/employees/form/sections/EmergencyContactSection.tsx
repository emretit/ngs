
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone } from "lucide-react";
import { Control } from "react-hook-form";

interface EmergencyContactSectionProps {
  control: Control<any>;
}

export const EmergencyContactSection = ({ control }: EmergencyContactSectionProps) => {
  return (
    <Card className="shadow-md border border-border/40 bg-gradient-to-br from-red-50/30 to-red-50/10 backdrop-blur-sm rounded-xl">
      <CardHeader className="pb-2 pt-2.5">
        <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
          <div className="p-1 rounded-md bg-gradient-to-br from-red-50 to-red-50/50 border border-red-200/50">
            <Phone className="h-3.5 w-3.5 text-red-600" />
          </div>
          Acil Durum İletişim Bilgileri
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-2 px-4 pb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <FormField
            control={control}
            name="emergency_contact_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium text-gray-700">İletişim Kişisi</FormLabel>
                <FormControl>
                  <Input placeholder="Acil durumda aranacak kişi" className="h-7 text-xs" {...field} />
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
                <FormLabel className="text-xs font-medium text-gray-700">Yakınlık Derecesi</FormLabel>
                <FormControl>
                  <Input placeholder="Yakınlık derecesi" className="h-7 text-xs" {...field} />
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
                <FormLabel className="text-xs font-medium text-gray-700">İletişim Telefonu</FormLabel>
                <FormControl>
                  <Input placeholder="Acil durum telefon numarası" className="h-7 text-xs" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
};
