
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Customer } from "@/types/customer";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const paymentSchema = z.object({
  amount: z.number().positive("Tutar 0'dan büyük olmalıdır"),
  payment_type: z.enum(["havale", "eft", "kredi_karti", "nakit"]),
  bank_account_id: z.string().uuid(),
  description: z.string().optional(),
  payment_date: z.date(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer;
}

export function PaymentDialog({ open, onOpenChange, customer }: PaymentDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      payment_date: new Date(),
    },
  });

  const { data: bankAccounts } = useQuery({
    queryKey: ["bank-accounts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bank_accounts")
        .select("*")
        .eq("is_active", true);

      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!open) {
      form.reset();
    }
  }, [open, form]);

  async function onSubmit(data: PaymentFormData) {
    try {
      // 1. Önce mevcut bakiyeleri al
      const { data: bankAccount, error: bankFetchError } = await supabase
        .from("bank_accounts")
        .select("current_balance, available_balance")
        .eq("id", data.bank_account_id)
        .single();

      if (bankFetchError) throw bankFetchError;

      const { data: customerData, error: customerFetchError } = await supabase
        .from("customers")
        .select("balance")
        .eq("id", customer.id)
        .single();

      if (customerFetchError) throw customerFetchError;

      // 2. Yeni ödemeyi ekle - status'u direkt "completed" olarak ayarla
      const { error: paymentError } = await supabase.from("payments").insert({
        amount: data.amount,
        payment_type: data.payment_type,
        bank_account_id: data.bank_account_id,
        description: data.description,
        payment_date: data.payment_date.toISOString(),
        customer_id: customer.id,
        payment_direction: "incoming",
        status: "completed", // Değişiklik burada: direkt "completed" olarak ayarlandı
        recipient_name: customer.name,
        currency: "TRY",
      });

      if (paymentError) throw paymentError;

      // 3. Banka hesabı bakiyesini güncelle
      const newCurrentBalance = bankAccount.current_balance + data.amount;
      const newAvailableBalance = bankAccount.available_balance + data.amount;

      const { error: bankUpdateError } = await supabase
        .from("bank_accounts")
        .update({
          current_balance: newCurrentBalance,
          available_balance: newAvailableBalance,
        })
        .eq("id", data.bank_account_id);

      if (bankUpdateError) throw bankUpdateError;

      // 4. Müşteri bakiyesini güncelle
      const newCustomerBalance = customerData.balance - data.amount;

      const { error: customerUpdateError } = await supabase
        .from("customers")
        .update({
          balance: newCustomerBalance,
        })
        .eq("id", customer.id);

      if (customerUpdateError) throw customerUpdateError;

      // Cache'i güncelle
      queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customer-payments", customer.id] });

      toast({
        title: "Ödeme başarıyla oluşturuldu",
        description: "Ödeme kaydedildi ve bakiyeler güncellendi.",
      });

      onOpenChange(false);
    } catch (error) {
      console.error("Payment error:", error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Ödeme oluşturulurken bir hata oluştu.",
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Yeni Ödeme Ekle</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tutar</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      value={field.value}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="payment_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ödeme Türü</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Ödeme türü seçin" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="havale">Havale</SelectItem>
                      <SelectItem value="eft">EFT</SelectItem>
                      <SelectItem value="kredi_karti">Kredi Kartı</SelectItem>
                      <SelectItem value="nakit">Nakit</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bank_account_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Banka Hesabı</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Banka hesabı seçin" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {bankAccounts?.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.account_name} - {account.bank_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="payment_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Ödeme Tarihi</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Tarih seçin</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Açıklama</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                İptal
              </Button>
              <Button type="submit">Kaydet</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
