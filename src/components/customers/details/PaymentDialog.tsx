
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
  // üç seçenek: hesap (nakit/kart/banka), çek, senet
  payment_type: z.enum(["hesap", "cek", "senet"]),
  payment_direction: z.enum(["incoming", "outgoing"]),
  // hesap seçilirse zorunlu olacak; şimdilik opsiyonel bırakıyoruz ve submit'te kontrol ediyoruz
  account_type: z.enum(["cash", "bank", "credit_card", "partner"]).optional(),
  account_id: z.string().uuid().optional(),
  description: z.string().optional(),
  payment_date: z.date(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer;
  defaultPaymentType?: "hesap" | "cek" | "senet" | null;
}

export function PaymentDialog({ open, onOpenChange, customer, defaultPaymentType }: PaymentDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      payment_date: new Date(),
      payment_direction: "incoming",
      payment_type: defaultPaymentType || "hesap",
      account_type: "bank",
    },
  });

  // defaultPaymentType değiştiğinde form'u güncelle
  useEffect(() => {
    if (defaultPaymentType) {
      form.setValue('payment_type', defaultPaymentType);
    }
  }, [defaultPaymentType, form]);

  // Tüm hesapları fetch et (birleşik accounts tablosundan)
  const { data: accounts } = useQuery({
    queryKey: ["payment-accounts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('accounts')
        .select('id, name, account_type, bank_name')
        .eq('is_active', true)
        .order('account_type', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;

      // Hesap türüne göre grupla
      const groupedAccounts = {
        bank: [],
        cash: [],
        credit_card: [],
        partner: []
      };

      data?.forEach(account => {
        let label = account.name;
        
        // Hesap türüne göre label oluştur
        if (account.account_type === 'bank' && account.bank_name) {
          label = `${account.name} - ${account.bank_name}`;
        } else if (account.account_type === 'credit_card' && account.bank_name) {
          label = `${account.name} - ${account.bank_name}`;
        }

        groupedAccounts[account.account_type].push({
          id: account.id,
          label: label
        });
      });

      return groupedAccounts;
    },
  });

  useEffect(() => {
    if (!open) {
      form.reset({
        payment_date: new Date(),
        payment_direction: "incoming",
        account_type: "bank",
      });
    }
  }, [open, form]);

  // Watch account type changes to reset account selection
  const accountType = form.watch("account_type");
  const selectedPaymentType = defaultPaymentType || "hesap";

  async function onSubmit(data: PaymentFormData) {
    try {
      // Önce kullanıcıyı ve company_id'yi al
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Kullanıcı bulunamadı");

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile?.company_id) throw new Error("Şirket bilgisi bulunamadı");

      // 1. Hesap bakiyesini kontrol et
      const { data: account, error: accountFetchError } = await supabase
        .from("accounts")
        .select("current_balance, account_type")
        .eq("id", data.account_id)
        .single();
      
      if (accountFetchError) throw accountFetchError;
      const accountBalance = account.current_balance;

      const { data: customerData, error: customerFetchError } = await supabase
        .from("customers")
        .select("balance")
        .eq("id", customer.id)
        .single();

      if (customerFetchError) throw customerFetchError;

      // 2. Yeni ödemeyi ekle
      const paymentData: any = {
        amount: data.amount,
        payment_type: selectedPaymentType || "hesap", // Dropdown'dan gelen değeri kullan
        description: data.description,
        payment_date: data.payment_date.toISOString(),
        customer_id: customer.id,
        payment_direction: data.payment_direction,
        currency: "TRY",
        company_id: profile.company_id,
        account_id: data.account_id // Birleşik accounts tablosundan
      };

      const { error: paymentError } = await supabase.from("payments").insert(paymentData);

      if (paymentError) throw paymentError;

      // 3. Hesap bakiyesini güncelle
      const balanceMultiplier = data.payment_direction === "incoming" ? 1 : -1;
      const newCurrentBalance = accountBalance + (data.amount * balanceMultiplier);

      // Banka hesapları için available_balance da güncelle
      if (account.account_type === "bank") {
        const { error: accountUpdateError } = await supabase
          .from("accounts")
          .update({
            current_balance: newCurrentBalance,
            available_balance: newCurrentBalance, // Basitleştirme için aynı değer
          })
          .eq("id", data.account_id);

        if (accountUpdateError) throw accountUpdateError;
      } else {
        // Diğer hesap türleri için sadece current_balance güncelle
        const { error: accountUpdateError } = await supabase
          .from("accounts")
          .update({
            current_balance: newCurrentBalance,
          })
          .eq("id", data.account_id);

        if (accountUpdateError) throw accountUpdateError;
      }

      // 4. Müşteri bakiyesini güncelle
      const customerBalanceMultiplier = data.payment_direction === "incoming" ? -1 : 1;
      const newCustomerBalance = customerData.balance + (data.amount * customerBalanceMultiplier);

      const { error: customerUpdateError } = await supabase
        .from("customers")
        .update({
          balance: newCustomerBalance,
        })
        .eq("id", customer.id);

      if (customerUpdateError) throw customerUpdateError;

      // Cache'i güncelle
      queryClient.invalidateQueries({ queryKey: ["payment-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customer-payments", customer.id] });
      queryClient.invalidateQueries({ queryKey: ["customer-payment-stats", customer.id] });

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
                        <SelectItem value="incoming">Gelen Ödeme (Müşteriden)</SelectItem>
                        <SelectItem value="outgoing">Giden Ödeme (Müşteriye)</SelectItem>
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
