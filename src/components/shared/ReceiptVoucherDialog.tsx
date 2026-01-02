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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EnhancedDatePicker } from "@/components/ui/enhanced-date-picker";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { toast } from "sonner";

const receiptVoucherSchema = z.object({
  voucher_type: z.enum(["alacak", "borc"], {
    required_error: "İşlem tipi seçilmelidir",
  }),
  amount: z.number().positive("Tutar 0'dan büyük olmalıdır"),
  payment_date: z.date({
    required_error: "İşlem tarihi gereklidir",
  }),
  description: z.string().min(1, "Açıklama gereklidir"),
});

type ReceiptVoucherFormData = z.infer<typeof receiptVoucherSchema>;

interface ReceiptVoucherDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId?: string;
  supplierId?: string;
  partnerName: string;
  onSaved?: () => void;
}

export default function ReceiptVoucherDialog({
  open,
  onOpenChange,
  customerId,
  supplierId,
  partnerName,
  onSaved
}: ReceiptVoucherDialogProps) {
  const queryClient = useQueryClient();
  const { userData } = useCurrentUser();

  const form = useForm<ReceiptVoucherFormData>({
    resolver: zodResolver(receiptVoucherSchema),
    defaultValues: {
      voucher_type: "alacak",
      amount: 0,
      payment_date: new Date(),
      description: "",
    },
  });

  useEffect(() => {
    if (!open) {
      form.reset({
        voucher_type: "alacak",
        amount: 0,
        payment_date: new Date(),
        description: "",
      });
    }
  }, [open, form]);

  const saveMutation = useMutation({
    mutationFn: async (data: ReceiptVoucherFormData) => {
      if (!userData?.company_id) {
        throw new Error("Şirket bilgisi bulunamadı");
      }

      // Bakiye güncellemesi
      // Müşteri için: borç = müşteri bize borçlu = bakiye artar (borç artar), alacak = müşteri bizden alacaklı = bakiye azalır (alacak artar)
      // Tedarikçi için: borç = tedarikçiye borçluyuz = bakiye artar (borç artar), alacak = tedarikçiden alacaklıyız = bakiye azalır (alacak artar)
      const balanceChange = customerId
        ? (data.voucher_type === "borc" ? data.amount : -data.amount)
        : (data.voucher_type === "borc" ? data.amount : -data.amount);

      if (customerId) {
        const { data: customer } = await supabase
          .from("customers")
          .select("balance")
          .eq("id", customerId)
          .single();

        const newBalance = (customer?.balance || 0) + balanceChange;

        const { error: updateError } = await supabase
          .from("customers")
          .update({ balance: newBalance })
          .eq("id", customerId);

        if (updateError) throw updateError;
      } else if (supplierId) {
        const { data: supplier } = await supabase
          .from("suppliers")
          .select("balance")
          .eq("id", supplierId)
          .single();

        const newBalance = (supplier?.balance || 0) + balanceChange;

        const { error: updateError } = await supabase
          .from("suppliers")
          .update({ balance: newBalance })
          .eq("id", supplierId);

        if (updateError) throw updateError;
      }

      // Payment direction hesaplama
      // Müşteri için: borç = outgoing (müşteriye borç yazıyoruz), alacak = incoming (müşteriye alacak yazıyoruz)
      // Tedarikçi için: borç = outgoing (tedarikçiye borç yazıyoruz), alacak = incoming (tedarikçiye alacak yazıyoruz)
      const paymentDirection = customerId
        ? (data.voucher_type === "borc" ? "outgoing" : "incoming")
        : (data.voucher_type === "borc" ? "outgoing" : "incoming");

      // Payments tablosuna kayıt ekle
      const paymentPayload: any = {
        company_id: userData.company_id,
        amount: data.amount,
        payment_type: "fis",
        payment_date: data.payment_date.toISOString(),
        payment_direction: paymentDirection,
        currency: "TRY",
        description: data.description,
      };

      if (customerId) {
        paymentPayload.customer_id = customerId;
      } else if (supplierId) {
        paymentPayload.supplier_id = supplierId;
      }

      const { error: paymentError } = await supabase
        .from("payments")
        .insert([paymentPayload]);

      if (paymentError) throw paymentError;
    },
    onSuccess: () => {
      toast.success("Fiş başarıyla oluşturuldu");
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });

      // Customer ID veya Supplier ID ile query'leri invalidate et
      if (customerId) {
        queryClient.invalidateQueries({ queryKey: ["customer-payments", customerId] });
        queryClient.invalidateQueries({ queryKey: ["customer", customerId] });
      }
      if (supplierId) {
        queryClient.invalidateQueries({ queryKey: ["supplier-payments", supplierId] });
        queryClient.invalidateQueries({ queryKey: ["supplier", supplierId] });
      }

      onOpenChange(false);
      onSaved?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Fiş oluşturulurken bir hata oluştu");
    }
  });

  async function onSubmit(data: ReceiptVoucherFormData) {
    saveMutation.mutate(data);
  }

  const voucherType = form.watch("voucher_type");

  // Dinamik açıklama metni
  const getVoucherTypeDescription = () => {
    if (customerId) {
      return voucherType === "borc" ? "müşteri borçlanacak" : "müşteri alacaklanacak";
    } else {
      return voucherType === "borc" ? "tedarikçi borçlanacak" : "tedarikçi alacaklanacak";
    }
  };

  return (
    <UnifiedDialog
      isOpen={open}
      onClose={(isOpen) => onOpenChange(isOpen)}
      title="Borç-Alacak Fişleri"
      maxWidth="xl"
      headerColor="green"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Açıklayıcı Metin */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-gray-700">
            Herhangi bir tahsilat, ödeme, satış ya da iade işlemi olmadan {customerId ? "müşterinizin" : "tedarikçinizin"} bakiyesini değiştirmek için borç ya da alacak fişi kaydı oluşturabilirsiniz.
            <br />
            {customerId ? "Müşterinizin" : "Tedarikçinizin"} güncel bakiyesi burada gireceğiniz tutar kadar değişecek ve ekstresine yansıyacaktır.
          </div>

          <div
            className="space-y-4 max-h-[60vh] overflow-y-auto pr-1"
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
            {/* İşlem Tipi */}
            <FormField
              control={form.control}
              name="voucher_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>İşlem Tipi <span className="text-red-500">*</span></FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="İşlem tipi seçin" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="alacak">Alacak Fişi</SelectItem>
                      <SelectItem value="borc">Borç Fişi</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">{getVoucherTypeDescription()}</p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* İşlem Tarihi */}
            <FormField
              control={form.control}
              name="payment_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>İşlem Tarihi <span className="text-red-500">*</span></FormLabel>
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

            {/* Tutar */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tutar <span className="text-red-500">*</span></FormLabel>
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

            {/* Açıklama */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Açıklama <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Fiş açıklaması..."
                      rows={4}
                      className="resize-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <UnifiedDialogFooter>
            <UnifiedDialogCancelButton onClick={() => onOpenChange(false)} />
            <UnifiedDialogActionButton
              type="submit"
              variant="primary"
              disabled={saveMutation.isPending}
              loading={saveMutation.isPending}
            >
              Kaydet
            </UnifiedDialogActionButton>
          </UnifiedDialogFooter>
        </form>
      </Form>
    </UnifiedDialog>
  );
}
