import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { DollarSign } from "lucide-react";
import { Control } from "react-hook-form";

interface SalarySectionProps {
  control: Control<any>;
}

export const SalarySection = ({ control }: SalarySectionProps) => {
  return (
    <Card className="shadow-md border border-border/40 bg-gradient-to-br from-green-50/30 to-green-50/10 backdrop-blur-sm rounded-xl">
      <CardHeader className="pb-2 pt-2.5">
        <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
          <div className="p-1 rounded-md bg-gradient-to-br from-green-50 to-green-50/50 border border-green-200/50">
            <DollarSign className="h-3.5 w-3.5 text-green-600" />
          </div>
          Maaş Bilgileri
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5 pt-0 px-3 pb-3">
        {/* Maaş Miktarı ve Para Birimi */}
        <div className="grid grid-cols-2 gap-1.5">
          <FormField
            control={control}
            name="salary_amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium text-gray-700">Maaş Miktarı</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="0.00" 
                    className="h-7 text-xs" 
                    {...field}
                    onChange={(e) => {
                      const value = e.target.value;
                      field.onChange(value === "" ? undefined : parseFloat(value) || 0);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="salary_currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium text-gray-700">Para Birimi</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value || "TRY"}
                >
                  <FormControl>
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue placeholder="Para birimi seçin" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="TRY">₺ TRY</SelectItem>
                    <SelectItem value="USD">$ USD</SelectItem>
                    <SelectItem value="EUR">€ EUR</SelectItem>
                    <SelectItem value="GBP">£ GBP</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Maaş Türü ve Ödeme Sıklığı */}
        <div className="grid grid-cols-2 gap-1.5">
          <FormField
            control={control}
            name="salary_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium text-gray-700">Maaş Türü</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value || "brüt"}
                >
                  <FormControl>
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue placeholder="Maaş türü seçin" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="brüt">Brüt Maaş</SelectItem>
                    <SelectItem value="net">Net Maaş</SelectItem>
                    <SelectItem value="saatlik">Saatlik Ücret</SelectItem>
                    <SelectItem value="günlük">Günlük Ücret</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="payment_frequency"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium text-gray-700">Ödeme Sıklığı</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value || "aylık"}
                >
                  <FormControl>
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue placeholder="Ödeme sıklığı seçin" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="aylık">Aylık</SelectItem>
                    <SelectItem value="haftalık">Haftalık</SelectItem>
                    <SelectItem value="günlük">Günlük</SelectItem>
                    <SelectItem value="saatlik">Saatlik</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Başlangıç Tarihi ve Açıklama */}
        <div className="grid grid-cols-2 gap-1.5">
          <FormField
            control={control}
            name="salary_start_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium text-gray-700">Maaş Başlangıç Tarihi</FormLabel>
                <FormControl>
                  <DatePicker
                    date={field.value ? new Date(field.value) : undefined}
                    onSelect={(date) => field.onChange(date ? date.toISOString().split('T')[0] : '')}
                    placeholder="Maaş başlangıç tarihi seçin"
                    className="h-7 text-xs"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="salary_notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium text-gray-700">Açıklama</FormLabel>
                <FormControl>
                  <Input placeholder="Maaş açıklaması" className="h-9 text-sm" {...field} />
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
