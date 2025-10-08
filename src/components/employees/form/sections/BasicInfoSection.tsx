
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { User } from "lucide-react";
import { Control } from "react-hook-form";

interface BasicInfoSectionProps {
  control: Control<any>;
}

export const BasicInfoSection = ({ control }: BasicInfoSectionProps) => {
  return (
    <Card className="shadow-md border border-border/50 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm rounded-lg">
      <CardHeader className="pb-2 pt-2 px-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <div className="p-0.5 rounded-sm bg-gradient-to-br from-blue-50 to-blue-50/50 border border-blue-200/50">
            <User className="h-3 w-3 text-blue-600" />
          </div>
          Temel Bilgiler
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 pt-0 px-3 pb-3">
        {/* Temel Bilgiler */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-2">
        <FormField
          control={control}
          name="first_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-medium text-gray-700">Ad</FormLabel>
              <FormControl>
                <Input placeholder="Çalışanın adı" className="h-7 text-xs" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="last_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-medium text-gray-700">Soyad</FormLabel>
              <FormControl>
                <Input placeholder="Çalışanın soyadı" className="h-7 text-xs" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-medium text-gray-700">E-posta</FormLabel>
              <FormControl>
                <Input type="email" placeholder="E-posta adresi" className="h-7 text-xs" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-medium text-gray-700">Telefon</FormLabel>
              <FormControl>
                <Input placeholder="Telefon numarası" className="h-7 text-xs" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="position"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-medium text-gray-700">Pozisyon</FormLabel>
              <FormControl>
                <Input placeholder="Çalışanın pozisyonu" className="h-7 text-xs" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="department"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-medium text-gray-700">Departman</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue placeholder="Departman seçin" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Mühendislik">Mühendislik</SelectItem>
                  <SelectItem value="Satış">Satış</SelectItem>
                  <SelectItem value="Pazarlama">Pazarlama</SelectItem>
                  <SelectItem value="Finans">Finans</SelectItem>
                  <SelectItem value="İnsan Kaynakları">İnsan Kaynakları</SelectItem>
                  <SelectItem value="Operasyon">Operasyon</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="hire_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-medium text-gray-700">İşe Başlama Tarihi</FormLabel>
              <FormControl>
                <Input type="date" className="h-7 text-xs" {...field} />
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
              <FormLabel className="text-xs font-medium text-gray-700">Durum</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger className="h-7 text-xs">
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
