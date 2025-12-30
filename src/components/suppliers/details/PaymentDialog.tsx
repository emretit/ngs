import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Supplier } from "@/types/supplier";
import { UnifiedDialog, UnifiedDialogFooter, UnifiedDialogActionButton, UnifiedDialogCancelButton } from "@/components/ui/unified-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { EnhancedDatePicker } from "@/components/ui/enhanced-date-picker";
import { toast } from "sonner";
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
  defaultPaymentType?: "hesap" | "cek" | "senet" | null;
}

export function PaymentDialog({ open, onOpenChange, supplier, defaultPaymentType }: PaymentDialogProps) {
  const queryClient = useQueryClient();
  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      payment_date: new Date(),
      payment_direction: "outgoing",
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

  // Tüm hesap türlerini fetch et
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

      const [cashRes, bankRes, cardRes, partnerRes] = await Promise.all([
        supabase.from('cash_accounts').select('id, name').eq('company_id', profile.company_id),
        supabase.from('bank_accounts').select('id, account_name, bank_name').eq('company_id', profile.company_id).eq("is_active", true),
        supabase.from('credit_cards').select('id, card_name').eq('company_id', profile.company_id),
        supabase.from('partner_accounts').select('id, partner_name').eq('company_id', profile.company_id)
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
  const selectedPaymentType = defaultPaymentType || "hesap";

  async function onSubmit(data: PaymentFormData) {
    try {
      // Şirket bilgisini al
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Kullanıcı bulunamadı");

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile?.company_id) throw new Error("Şirket bilgisi bulunamadı");

      const { data: supplierData, error: supplierFetchError } = await supabase
        .from("suppliers")
        .select("balance")
        .eq("id", supplier.id)
        .single();

      if (supplierFetchError) throw supplierFetchError;

      // 2. Yeni ödemeyi ekle
      const paymentData: any = {
        amount: data.amount,
        payment_type: selectedPaymentType || "hesap", // Dropdown'dan gelen değeri kullan
        description: data.description,
        payment_date: data.payment_date.toISOString(),
        supplier_id: supplier.id,
        payment_direction: data.payment_direction,
        currency: "TRY",
        company_id: profile.company_id, // RLS için gerekli
      };

      // Hesap bilgisini ekle
      if (data.account_id && data.account_type) {
        paymentData.account_id = data.account_id;
        paymentData.account_type = data.account_type;
      }

      const { error: paymentError } = await supabase.from("payments").insert(paymentData);

      if (paymentError) throw paymentError;

      // 3. Hesap bakiyesini güncelle
      const balanceMultiplier = data.payment_direction === "incoming" ? 1 : -1;

      if (data.account_type === "bank") {
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
      } else if (data.account_type === "cash") {
        const { data: cashAccount, error: cashFetchError } = await supabase
          .from("cash_accounts")
          .select("current_balance")
          .eq("id", data.account_id)
          .single();

        if (cashFetchError) throw cashFetchError;

        const newCurrentBalance = cashAccount.current_balance + (data.amount * balanceMultiplier);

        const { error: cashUpdateError } = await supabase
          .from("cash_accounts")
          .update({
            current_balance: newCurrentBalance,
          })
          .eq("id", data.account_id);

        if (cashUpdateError) throw cashUpdateError;
      } else if (data.account_type === "credit_card") {
        const { error: cardUpdateError } = await supabase.rpc('update_credit_card_balance', {
          card_id: data.account_id,
          amount: data.amount * balanceMultiplier,
          transaction_type: data.payment_direction === 'incoming' ? 'income' : 'expense'
        });

        if (cardUpdateError) throw cardUpdateError;
      } else if (data.account_type === "partner") {
        const { error: partnerUpdateError } = await supabase.rpc('update_partner_account_balance', {
          account_id: data.account_id,
          amount: data.amount * balanceMultiplier,
          transaction_type: data.payment_direction === 'incoming' ? 'income' : 'expense'
        });

        if (partnerUpdateError) throw partnerUpdateError;
      }

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

      // Cache'i güncelle - company_id ile birlikte invalidate et
      queryClient.invalidateQueries({ queryKey: ["payment-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      queryClient.invalidateQueries({ queryKey: ["supplier-payments", supplier.id, profile.company_id] });
      queryClient.invalidateQueries({ queryKey: ["supplier-payment-stats", supplier.id] });
      queryClient.invalidateQueries({ queryKey: ["supplier", supplier.id] });
      
      // İşlem geçmişi tablosunu yenile - company_id'ye göre tüm supplier-activities query'lerini invalidate et
      queryClient.invalidateQueries({ 
        queryKey: ["supplier-activities", supplier.id, profile.company_id] 
      });
      
      // Hemen refetch yap - sayfanın anında güncellenmesi için
      await Promise.all([
        queryClient.refetchQueries({ 
          queryKey: ["supplier-payments", supplier.id, profile.company_id] 
        }),
        queryClient.refetchQueries({ 
          queryKey: ["supplier", supplier.id] 
        }),
        queryClient.refetchQueries({ 
          queryKey: ["supplier-activities", supplier.id, profile.company_id] 
        })
      ]);

      toast.success("Ödeme kaydedildi ve bakiyeler güncellendi.", { duration: 1000 });

      onOpenChange(false);
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Ödeme oluşturulurken bir hata oluştu.", { duration: 1000 });
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