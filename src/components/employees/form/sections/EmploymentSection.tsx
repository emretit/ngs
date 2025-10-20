import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase } from "lucide-react";
import { Control } from "react-hook-form";
import { EmployeeFormValues } from "../hooks/useEmployeeForm";
import { DepartmentSelect } from "./DepartmentSelect";

interface EmploymentSectionProps {
  control: Control<EmployeeFormValues>;
}

export const EmploymentSection = ({ control }: EmploymentSectionProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Briefcase className="h-5 w-5" />
          İstihdam Bilgileri
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={control}
            name="position"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pozisyon *</FormLabel>
                <FormControl>
                  <Input placeholder="Pozisyon giriniz" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <DepartmentSelect control={control} />

          <FormField
            control={control}
            name="hire_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>İşe Başlama Tarihi *</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Durum *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Durum seçin" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="aktif">Aktif</SelectItem>
                    <SelectItem value="pasif">Pasif</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
};
