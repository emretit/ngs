import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { UnifiedDialog, UnifiedDialogFooter, UnifiedDialogActionButton, UnifiedDialogCancelButton } from "@/components/ui/unified-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EnhancedDatePicker } from "@/components/ui/enhanced-date-picker";
import { format } from "date-fns";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { toast } from "sonner";

const balanceAdjustmentSchema = z.object({
  new_balance: z.number().positive("Yeni bakiye 0'dan büyük olmalıdır"),
  adjustment_date: z.date({
    required_error: "Ödeme tarihi gereklidir",
  }),
  notes: z.string().min(1, "Açıklama gereklidir"),
});

type BalanceAdjustmentFormData = z.infer<typeof balanceAdjustmentSchema>;

interface BalanceAdjustmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId?: string;
  supplierId?: string;
  currentBalance: number;
  partnerName: string;
  onSaved?: () => void;
}

export default function BalanceAdjustmentDialog({
  open,
  onOpenChange,
  customerId,
  supplierId,
  currentBalance,
  partnerName,
  onSaved
}: BalanceAdjustmentDialogProps) {
  const queryClient = useQueryClient();
  const { userData } = useCurrentUser();
  
  const form = useForm<BalanceAdjustmentFormData>({
    resolver: zodResolver(balanceAdjustmentSchema),
    defaultValues: {
      new_balance: currentBalance,
      adjustment_date: new Date(),
      notes: "",
    },
  });

  useEffect(() => {
    if (!open) {
      form.reset({
        new_balance: currentBalance,
        adjustment_date: new Date(),
        notes: "",
      });
    }
  }, [open, currentBalance, form]);

  const saveMutation = useMutation({
    mutationFn: async (data: BalanceAdjustmentFormData) => {
      if (!userData?.company_id) {
        throw new Error("Şirket bilgisi bulunamadı");
      }

      const difference = data.new_balance - currentBalance;

      // Fark sıfırsa işlem yapma
      if (difference === 0) {
        throw new Error("Yeni bakiye mevcut bakiye ile aynı");
      }

      // Fişin yönünü belirle
      // Fark pozitif ise: Bakiye artacak → Müşteri/Tedarikçi için BORÇ FİŞİ (outgoing)
      // Fark negatif ise: Bakiye azalacak → Müşteri/Tedarikçi için ALACAK FİŞİ (incoming)
      const paymentDirection = difference > 0 ? 'outgoing' : 'incoming';
      const amount = Math.abs(difference);

      // Fiş kaydı oluştur
      const paymentPayload: any = {
        company_id: userData.company_id,
        payment_date: format(data.adjustment_date, "yyyy-MM-dd"),
        amount: amount,
        currency: 'TRY',
        payment_direction: paymentDirection,
        payment_type: 'fis', // Bakiye düzeltme fişi
        description: `Bakiye Düzeltme Fişi - ${data.notes}`,
        reference_note: `Eski Bakiye: ${currentBalance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}, Yeni Bakiye: ${data.new_balance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`,
      };

      if (customerId) {
        paymentPayload.customer_id = customerId;
      } else if (supplierId) {
        paymentPayload.supplier_id = supplierId;
      }

      // Fiş kaydını oluştur - Trigger otomatik olarak bakiyeyi güncelleyecek
      const { error: paymentError } = await supabase
        .from("payments")
        .insert([paymentPayload]);

      if (paymentError) throw paymentError;

      // Bakiye düzeltme kaydını da oluştur (log için)
      const adjustmentPayload: any = {
        company_id: userData.company_id,
        adjustment_date: format(data.adjustment_date, "yyyy-MM-dd"),
        old_balance: currentBalance,
        new_balance: data.new_balance,
        difference: difference,
        notes: data.notes || null,
        adjusted_by: userData.id,
      };

      if (customerId) {
        adjustmentPayload.customer_id = customerId;
      } else if (supplierId) {
        adjustmentPayload.supplier_id = supplierId;
      }

      const { error: adjustmentError } = await supabase
        .from("balance_adjustments")
        .insert([adjustmentPayload]);

      if (adjustmentError) {
        console.error("Balance adjustment log error:", adjustmentError);
        // Log hatası işlemi durdurmasın
      }
    },
    onSuccess: async () => {
      toast.success("Bakiye düzeltme fişi oluşturuldu");

      // Genel query'leri invalidate et
      queryClient.invalidateQueries({
        queryKey: ["customers"],
        exact: false
      });
      queryClient.invalidateQueries({
        queryKey: ["suppliers"],
        exact: false
      });

      // Customer ID veya Supplier ID ile spesifik query'leri invalidate et
      if (customerId) {
        queryClient.invalidateQueries({ queryKey: ["customer-payments", customerId, userData?.company_id] });
        queryClient.invalidateQueries({ queryKey: ["customer", customerId] });
        queryClient.invalidateQueries({ queryKey: ["customer-payment-stats", customerId] });
        queryClient.invalidateQueries({ queryKey: ["customer-sales-invoices", customerId, userData?.company_id] });
        queryClient.invalidateQueries({ queryKey: ["customer-purchase-invoices", customerId, userData?.company_id] });
        queryClient.invalidateQueries({ queryKey: ["customer-activities", customerId, userData?.company_id] });
        
        // Hemen refetch yap - sayfanın anında güncellenmesi için
        await queryClient.refetchQueries({ 
          queryKey: ["customer-payments", customerId, userData?.company_id] 
        });
        await queryClient.refetchQueries({ 
          queryKey: ["customer", customerId] 
        });
      }
      if (supplierId) {
        queryClient.invalidateQueries({ queryKey: ["supplier-payments", supplierId, userData?.company_id] });
        queryClient.invalidateQueries({ queryKey: ["supplier", supplierId] });
        queryClient.invalidateQueries({ queryKey: ["supplier-purchase-invoices", supplierId, userData?.company_id] });
        queryClient.invalidateQueries({ queryKey: ["supplier-sales-invoices", supplierId, userData?.company_id] });
        queryClient.invalidateQueries({ queryKey: ["supplier-activities", supplierId, userData?.company_id] });
        
        // Hemen refetch yap - sayfanın anında güncellenmesi için
        await queryClient.refetchQueries({ 
          queryKey: ["supplier-payments", supplierId, userData?.company_id] 
        });
        await queryClient.refetchQueries({ 
          queryKey: ["supplier", supplierId] 
        });
      }

      onOpenChange(false);
      onSaved?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Bakiye güncellenirken bir hata oluştu");
    }
  });

  async function onSubmit(data: BalanceAdjustmentFormData) {
    saveMutation.mutate(data);
  }

  const newBalance = form.watch("new_balance");
  const difference = (newBalance || 0) - currentBalance;

  return (
    <UnifiedDialog
      isOpen={open}
      onClose={(isOpen) => onOpenChange(isOpen)}
      title="Bakiye Düzelt"
      maxWidth="xl"
      headerColor="yellow"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div 
            className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto pr-1"
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { 
                e.preventDefault(); 
                form.handleSubmit(onSubmit)(); 
              }
              if (e.key === 'Escape') { 
                e.preventDefault(); 
                onOpenChange(false); 
              }
            }}
          >
            {/* Temel Bilgiler: iki sütunu kapla ve içeride iki kolon kullan */}
            <div className="lg:col-span-2 space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">Temel Bilgiler</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Müşteri/Tedarikçi Adı */}
                <div className="space-y-1">
                  <FormLabel className="text-sm font-medium text-gray-700">
                    {customerId ? "Müşteri" : "Tedarikçi"}
                  </FormLabel>
                  <Input
                    value={partnerName}
                    disabled
                    className="bg-gray-50 h-9"
                  />
                </div>

                {/* Ödeme Tarihi */}
                <FormField
                  control={form.control}
                  name="adjustment_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ödeme Tarihi <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <EnhancedDatePicker
                          date={field.value}
                          onSelect={(newDate) => newDate && field.onChange(newDate)}
                          placeholder="Tarih seçin"
                          className="w-full h-9"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Sol sütun: Bakiye Bilgileri */}
            <div className="space-y-4">
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">Bakiye Bilgileri</h3>
                <div className="space-y-1">
                  <FormLabel className="text-sm font-medium text-gray-700">
                    Mevcut Bakiye
                  </FormLabel>
                  <Input
                    value={currentBalance.toLocaleString('tr-TR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                    disabled
                    className="bg-gray-50 h-9 font-semibold"
                  />
                </div>
                <FormField
                  control={form.control}
                  name="new_balance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Yeni Bakiye <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          value={field.value || ""}
                          placeholder="0.00"
                          className="h-9"
                          autoFocus
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Fark Göstergesi */}
                {!isNaN(difference) && difference !== 0 && (
                  <div className={`p-2 rounded-lg border ${
                    difference > 0
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-700">Fark:</span>
                      <span className={`text-sm font-bold ${
                        difference > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {difference > 0 ? '+' : ''}
                        {difference.toLocaleString('tr-TR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })} ₺
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sağ sütun: Açıklama */}
            <div className="space-y-4">
              <div className="space-y-1">
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Açıklama <span className="text-red-500">*</span></FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Bakiye düzeltme sebebini açıklayın..."
                          rows={6}
                          className="resize-none"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="lg:col-span-2">
              <UnifiedDialogFooter>
                <UnifiedDialogCancelButton onClick={() => onOpenChange(false)} />
                <UnifiedDialogActionButton 
                  onClick={form.handleSubmit(onSubmit)}
                  variant="primary"
                  disabled={saveMutation.isPending}
                  loading={saveMutation.isPending}
                >
                  Bakiyeyi Güncelle
                </UnifiedDialogActionButton>
              </UnifiedDialogFooter>
            </div>
          </div>
        </form>
      </Form>
    </UnifiedDialog>
  );
}
