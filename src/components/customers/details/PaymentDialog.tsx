
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Customer } from "@/types/customer";
import { UnifiedDialog, UnifiedDialogFooter, UnifiedDialogActionButton, UnifiedDialogCancelButton } from "@/components/ui/unified-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { EnhancedDatePicker } from "@/components/ui/enhanced-date-picker";
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
      // Şirket bilgisini al
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Kullanıcı bulunamadı");

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile?.company_id) throw new Error("Şirket bilgisi bulunamadı");

      const { data, error } = await supabase
        .from('accounts')
        .select('id, name, account_type, bank_name')
        .eq('is_active', true)
        .eq('company_id', profile.company_id)
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
    <UnifiedDialog
      isOpen={open}
      onClose={(isOpen) => onOpenChange(isOpen)}
      title="Yeni Ödeme Ekle"
      maxWidth="xl"
      headerColor="green"
    >
        <Form {...form}>
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

              <FormField
                control={form.control}
                name="payment_direction"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ödeme Yönü <span className="text-red-500">*</span></FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-9">
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

              <FormField
                control={form.control}
                name="payment_date"
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

          {/* Sol sütun: Hesap Bilgileri */}
          {selectedPaymentType === 'hesap' && (
            <div className="space-y-4">
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">Hesap Bilgileri</h3>
                <FormField
                  control={form.control}
                  name="account_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hesap Türü <span className="text-red-500">*</span></FormLabel>
                    <Select onValueChange={(value) => {
                      field.onChange(value);
                      form.setValue("account_id", "");
                    }} defaultValue={field.value}>
                      <FormControl>
                          <SelectTrigger className="h-9 w-full">
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
                />

              <FormField
                control={form.control}
                name="account_id"
                render={({ field }) => (
                  <FormItem>
                      <FormLabel>Hesap <span className="text-red-500">*</span></FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                          <SelectTrigger className="h-9 w-full">
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
                />
              </div>
            </div>
          )}

          {/* Sağ sütun: Açıklama (eğer hesap seçiliyse) veya tam genişlik (değilse) */}
          <div className={selectedPaymentType === 'hesap' ? "space-y-4" : "lg:col-span-2"}>
            <div className="space-y-1">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Açıklama</FormLabel>
                        <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="Ödeme açıklaması"
                        rows={selectedPaymentType === 'hesap' ? 6 : 3}
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
              >
                Kaydet
              </UnifiedDialogActionButton>
            </UnifiedDialogFooter>
          </div>
            </div>
        </Form>
    </UnifiedDialog>
  );
}
