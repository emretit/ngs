import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Supplier } from "@/types/supplier";
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
  payment_type: z.enum(["hesap", "cek", "senet"]),
  payment_direction: z.enum(["incoming", "outgoing"]),
  account_type: z.enum(["cash", "bank", "credit_card", "partner"]).optional(),
  account_id: z.string().uuid().optional(),
  description: z.string().optional(),
  payment_date: z.date(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier: Supplier;
}

export function PaymentDialog({ open, onOpenChange, supplier }: PaymentDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      payment_date: new Date(),
      payment_direction: "outgoing",
      payment_type: "hesap",
      account_type: "bank",
    },
  });

  // Tüm hesap türlerini fetch et
  const { data: accounts } = useQuery({
    queryKey: ["payment-accounts"],
    queryFn: async () => {
      const [cashRes, bankRes, cardRes, partnerRes] = await Promise.all([
        supabase.from('cash_accounts').select('id, name'),
        supabase.from('bank_accounts').select('id, account_name, bank_name').eq("is_active", true),
        supabase.from('credit_cards').select('id, card_name'),
        supabase.from('partner_accounts').select('id, partner_name')
      ]);

      return {
        cash: cashRes.data?.map(a => ({ id: a.id, label: a.name })) || [],
        bank: bankRes.data?.map(a => ({ id: a.id, label: `${a.account_name} - ${a.bank_name}` })) || [],
        credit_card: cardRes.data?.map(a => ({ id: a.id, label: a.card_name })) || [],
        partner: partnerRes.data?.map(a => ({ id: a.id, label: a.partner_name })) || []
      };
    },
  });

  useEffect(() => {
    if (!open) {
      form.reset({
        payment_date: new Date(),
        payment_direction: "outgoing",
        account_type: "bank",
      });
    }
  }, [open, form]);

  // Watch account type changes to reset account selection
  const accountType = form.watch("account_type");
  const selectedPaymentType = form.watch("payment_type");

  async function onSubmit(data: PaymentFormData) {
    try {
      const { data: supplierData, error: supplierFetchError } = await supabase
        .from("suppliers")
        .select("balance")
        .eq("id", supplier.id)
        .single();

      if (supplierFetchError) throw supplierFetchError;

      // 2. Yeni ödemeyi ekle - status'u direkt "completed" olarak ayarla
      const paymentData: any = {
        amount: data.amount,
        payment_type: data.payment_type,
        description: data.description,
        payment_date: data.payment_date.toISOString(),
        supplier_id: supplier.id,
        payment_direction: data.payment_direction,
        status: "completed",
        recipient_name: supplier.name || supplier.company,
        currency: "TRY",
      };

      // Şimdilik sadece banka hesapları destekleniyor
      if (data.account_type === "bank") {
        paymentData.bank_account_id = data.account_id;
      } else {
        throw new Error("Şu anda sadece banka hesapları desteklenmektedir.");
      }

      const { error: paymentError } = await supabase.from("payments").insert(paymentData);

      if (paymentError) throw paymentError;

      // 3. Banka hesabı bakiyesini güncelle
      const balanceMultiplier = data.payment_direction === "incoming" ? 1 : -1;
      const { data: bankAccount, error: bankFetchError } = await supabase
        .from("bank_accounts")
        .select("current_balance, available_balance")
        .eq("id", data.account_id)
        .single();

      if (bankFetchError) throw bankFetchError;

      const newCurrentBalance = bankAccount.current_balance + (data.amount * balanceMultiplier);
      const newAvailableBalance = bankAccount.available_balance + (data.amount * balanceMultiplier);

      const { error: bankUpdateError } = await supabase
        .from("bank_accounts")
        .update({
          current_balance: newCurrentBalance,
          available_balance: newAvailableBalance,
        })
        .eq("id", data.account_id);

      if (bankUpdateError) throw bankUpdateError;

      // 4. Tedarikçi bakiyesini güncelle
      const supplierBalanceMultiplier = data.payment_direction === "incoming" ? -1 : 1;
      const newSupplierBalance = supplierData.balance + (data.amount * supplierBalanceMultiplier);

      const { error: supplierUpdateError } = await supabase
        .from("suppliers")
        .update({
          balance: newSupplierBalance,
        })
        .eq("id", supplier.id);

      if (supplierUpdateError) throw supplierUpdateError;

      // Cache'i güncelle
      queryClient.invalidateQueries({ queryKey: ["payment-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      queryClient.invalidateQueries({ queryKey: ["supplier-payments", supplier.id] });

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
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Yeni Ödeme Ekle</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                name="payment_direction"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ödeme Yönü</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Ödeme yönü seçin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="incoming">Gelen Ödeme (Tedarikçiden)</SelectItem>
                        <SelectItem value="outgoing">Giden Ödeme (Tedarikçiye)</SelectItem>
                      </SelectContent>
                    </Select>
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
                        <SelectItem value="hesap">Nakit - Kredi Kartı - Banka</SelectItem>
                        <SelectItem value="cek">Çek</SelectItem>
                        <SelectItem value="senet">Senet</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedPaymentType === 'hesap' && (
              <FormField
                control={form.control}
                name="account_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hesap Türü</FormLabel>
                    <Select onValueChange={(value) => {
                      field.onChange(value);
                      form.setValue("account_id", "");
                    }} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Hesap türü seçin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="cash">Kasa</SelectItem>
                        <SelectItem value="bank">Banka</SelectItem>
                        <SelectItem value="credit_card">Kredi Kartı</SelectItem>
                        <SelectItem value="partner">Ortak Hesabı</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />)}

              {selectedPaymentType === 'hesap' && (
              <FormField
                control={form.control}
                name="account_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hesap</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Hesap seçin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {accountType === 'cash' && accounts?.cash?.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.label}
                          </SelectItem>
                        ))}
                        {accountType === 'bank' && accounts?.bank?.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.label}
                          </SelectItem>
                        ))}
                        {accountType === 'credit_card' && accounts?.credit_card?.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.label}
                          </SelectItem>
                        ))}
                        {accountType === 'partner' && accounts?.partner?.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />)}

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
            </div>

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