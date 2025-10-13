import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign } from "lucide-react";
import { Control, useWatch } from "react-hook-form";
import { useEffect, useState } from "react";

interface SalarySectionProps {
  control: Control<any>;
}

export const SalarySection = ({ control }: SalarySectionProps) => {
  const [totalCost, setTotalCost] = useState(0);
  
  // Watch değerleri
  const netSalary = useWatch({ control, name: "net_salary" }) || 0;
  const sgkCost = useWatch({ control, name: "manual_employer_sgk_cost" }) || 0;
  const mealAllowance = useWatch({ control, name: "meal_allowance" }) || 0;
  const transportAllowance = useWatch({ control, name: "transport_allowance" }) || 0;

  // Toplam maliyeti hesapla
  useEffect(() => {
    const net = parseFloat(netSalary.toString()) || 0;
    const sgk = parseFloat(sgkCost.toString()) || 0;
    const meal = parseFloat(mealAllowance.toString()) || 0;
    const transport = parseFloat(transportAllowance.toString()) || 0;
    
    const total = net + sgk + meal + transport;
    setTotalCost(total);
  }, [netSalary, sgkCost, mealAllowance, transportAllowance]);

  return (
    <Card className="shadow-lg border border-border/50 bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm rounded-xl">
      <CardHeader className="pb-2 pt-3 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
            <div className="p-1 rounded-md bg-gradient-to-br from-green-50 to-green-50/50 border border-green-200/50">
              <DollarSign className="h-3.5 w-3.5 text-green-600" />
            </div>
            Maaş Bilgileri
          </CardTitle>
          {totalCost > 0 && (
            <div className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md border border-green-200">
              Toplam: ₺{totalCost.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0 px-4 pb-4">
        {/* Net Maaş ve SGK */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FormField
            control={control}
            name="net_salary"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium text-gray-700">Net Maaş (₺)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    placeholder="Net maaşı girin"
                    className="h-7 text-xs"
                    onChange={(e) => {
                      const value = e.target.value;
                      field.onChange(value === "" ? 0 : parseFloat(value) || 0);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="manual_employer_sgk_cost"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium text-gray-700">SGK İşveren Maliyeti (₺)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    placeholder="SGK işveren maliyeti"
                    className="h-7 text-xs"
                    onChange={(e) => {
                      const value = e.target.value;
                      field.onChange(value === "" ? 0 : parseFloat(value) || 0);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Yol ve Yemek Yardımları */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <FormField
            control={control}
            name="transport_allowance"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium text-gray-700">Yol Yardımı (₺)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    placeholder="0"
                    className="h-7 text-xs"
                    onChange={(e) => {
                      const value = e.target.value;
                      field.onChange(value === "" ? 0 : parseFloat(value) || 0);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={control}
            name="meal_allowance"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium text-gray-700">Yemek Yardımı (₺)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    placeholder="0"
                    className="h-7 text-xs"
                    onChange={(e) => {
                      const value = e.target.value;
                      field.onChange(value === "" ? 0 : parseFloat(value) || 0);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Notlar */}
        <FormField
          control={control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-medium text-gray-700">Notlar</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Maaş ile ilgili notlar..."
                  className="h-7 text-xs"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
};
