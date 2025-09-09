
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Control } from "react-hook-form";

interface PersonalInfoSectionProps {
  control: Control<any>;
}

export const PersonalInfoSection = ({ control }: PersonalInfoSectionProps) => {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Kişisel Bilgiler</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={control}
          name="date_of_birth"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Doğum Tarihi</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="gender"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cinsiyet</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Cinsiyet seçin" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="male">Erkek</SelectItem>
                  <SelectItem value="female">Kadın</SelectItem>
                  <SelectItem value="other">Diğer</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="marital_status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Medeni Durum</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Medeni durum seçin" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="single">Bekar</SelectItem>
                  <SelectItem value="married">Evli</SelectItem>
                  <SelectItem value="divorced">Boşanmış</SelectItem>
                  <SelectItem value="widowed">Dul</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="id_ssn"
          render={({ field }) => (
            <FormItem>
              <FormLabel>TC Kimlik No / SSN</FormLabel>
              <FormControl>
                <Input placeholder="TC Kimlik No veya SSN" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};
