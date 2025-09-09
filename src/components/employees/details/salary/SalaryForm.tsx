import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useForm } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, Form } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";

interface SalaryFormProps {
  employeeId: string;
  onSave: (values: any) => Promise<void>;
  onClose: () => void;
  existingSalary?: any;
}

export const SalaryForm = ({ employeeId, onSave, onClose, existingSalary }: SalaryFormProps) => {
  const { toast } = useToast();
  const [totalCost, setTotalCost] = useState(0);

  const form = useForm({
    defaultValues: {
      netSalary: existingSalary?.net_salary?.toString() || "",
      manualEmployerSgkCost: existingSalary?.manual_employer_sgk_cost?.toString() || "",
      mealAllowance: existingSalary?.meal_allowance?.toString() || "0",
      transportAllowance: existingSalary?.transport_allowance?.toString() || "0",
      notes: existingSalary?.notes || ""
    }
  });

  const netSalary = form.watch("netSalary");
  const manualEmployerSgkCost = form.watch("manualEmployerSgkCost");
  const mealAllowance = form.watch("mealAllowance");
  const transportAllowance = form.watch("transportAllowance");

  // Calculate total cost whenever any field changes
  useEffect(() => {
    const net = parseFloat(netSalary) || 0;
    const sgk = parseFloat(manualEmployerSgkCost) || 0;
    const meal = parseFloat(mealAllowance) || 0;
    const transport = parseFloat(transportAllowance) || 0;
    
    const total = net + sgk + meal + transport;
    setTotalCost(total);
  }, [netSalary, manualEmployerSgkCost, mealAllowance, transportAllowance]);

  const handleSubmit = async (values: any) => {
    try {
      const salaryData = {
        employee_id: employeeId,
        net_salary: parseFloat(values.netSalary),
        manual_employer_sgk_cost: parseFloat(values.manualEmployerSgkCost || '0'),
        meal_allowance: parseFloat(values.mealAllowance || '0'),
        transport_allowance: parseFloat(values.transportAllowance || '0'),
        total_employer_cost: totalCost,
        effective_date: new Date().toISOString().split('T')[0],
        notes: values.notes,
        // Set other fields to 0 or null since we're using simplified calculation
        gross_salary: parseFloat(values.netSalary), // Set gross same as net for simplicity
        salary_input_type: 'net',
        calculate_as_minimum_wage: false,
        sgk_employer_rate: 0,
        unemployment_employer_rate: 0,
        accident_insurance_rate: 0,
        stamp_tax: 0,
        severance_provision: 0,
        bonus_provision: 0
      };

      // Use UPSERT to handle both insert and update
      const { data, error } = await supabase
        .from('employee_salaries')
        .upsert(salaryData, { 
          onConflict: 'employee_id',
          ignoreDuplicates: false 
        });

      if (error) throw error;

      toast({
        title: "Başarılı",
        description: existingSalary ? "Maaş bilgileri başarıyla güncellendi" : "Maaş kaydı başarıyla eklendi",
      });

      await onSave(values);
      onClose();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: error.message || "Maaş bilgileri kaydedilirken hata oluştu",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Basit Maaş Bilgileri */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                💰 Maaş Bilgileri
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Basit hesaplama: Net Maaş + SGK İşveren Maliyeti + Yol + Yemek = Toplam Maliyet
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Net Maaş */}
              <FormField
                control={form.control}
                name="netSalary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">Net Maaş (₺)</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number" 
                        placeholder="Net maaşı girin"
                        className="text-lg h-12 border-2 border-blue-300 focus:border-blue-500"
                        required
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* SGK İşveren Maliyeti */}
              <FormField
                control={form.control}
                name="manualEmployerSgkCost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">SGK İşveren Maliyeti (₺)</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number" 
                        placeholder="SGK işveren maliyetini girin"
                        className="text-lg h-12 border-2 border-green-300 focus:border-green-500"
                        required
                      />
                    </FormControl>
                    <p className="text-sm text-muted-foreground">
                      Manuel olarak girilen SGK işveren maliyeti
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Yardımlar */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="mealAllowance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold">🍽️ Yemek Yardımı (₺)</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="number" 
                          placeholder="0"
                          className="text-lg h-12 border-2 border-orange-300 focus:border-orange-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="transportAllowance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold">🚗 Yol Yardımı (₺)</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="number" 
                          placeholder="0"
                          className="text-lg h-12 border-2 border-purple-300 focus:border-purple-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Toplam Maliyet */}
          {totalCost > 0 && (
            <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  📊 Toplam İşveren Maliyeti
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Hesaplama Detayları */}
                  <div className="bg-white rounded-lg p-4 border border-gray-200 space-y-2">
                    <div className="flex justify-between">
                      <span>Net Maaş:</span>
                      <span className="font-semibold">₺{(parseFloat(netSalary) || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>SGK İşveren Maliyeti:</span>
                      <span className="font-semibold">₺{(parseFloat(manualEmployerSgkCost) || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Yemek Yardımı:</span>
                      <span className="font-semibold">₺{(parseFloat(mealAllowance) || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Yol Yardımı:</span>
                      <span className="font-semibold">₺{(parseFloat(transportAllowance) || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <hr className="my-2" />
                    <div className="flex justify-between text-lg font-bold text-blue-700">
                      <span>TOPLAM MALİYET:</span>
                      <span>₺{totalCost.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                  
                  {/* Toplam Maliyet Kartı */}
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white text-center">
                    <div className="text-sm opacity-90 mb-2">Aylık Toplam İşveren Maliyeti</div>
                    <div className="text-3xl font-bold">
                      ₺{totalCost.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notlar */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">📝 Notlar</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="Ek notlar girin..."
                        className="text-base min-h-20"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
          
          {/* Butonlar */}
          <div className="flex gap-3 pt-4">
            <Button 
              type="submit" 
              className="flex-1 h-12 text-lg bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700"
            >
              {existingSalary ? "✏️ Maaş Bilgilerini Güncelle" : "💾 Maaş Kaydını Kaydet"}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="h-12 px-8 text-lg border-2"
            >
              ❌ İptal
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};