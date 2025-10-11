import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone } from "lucide-react";
import { Control } from "react-hook-form";
import { EmployeeFormValues } from "../hooks/useEmployeeForm";

interface EmergencyContactSectionEditProps {
  control: Control<EmployeeFormValues>;
}

export const EmergencyContactSectionEdit = ({ control }: EmergencyContactSectionEditProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Phone className="h-5 w-5" />
          Acil Durum İletişim Bilgileri
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={control}
            name="emergency_contact_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>İletişim Kişisi</FormLabel>
                <FormControl>
                  <Input placeholder="Ad Soyad" {...field} />
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
                  <Input placeholder="Örn: Anne, Baba, Eş" {...field} />
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
                <FormLabel>Telefon</FormLabel>
                <FormControl>
                  <Input placeholder="(5XX) XXX XX XX" {...field} />
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
