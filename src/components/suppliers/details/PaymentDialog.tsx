import { useEffect } from "react";
import { logger } from '@/utils/logger';
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
import { usePaymentAllocation } from "@/hooks/usePaymentAllocation";

const paymentSchema = z.object({
  amount: z.number().positive("Tutar 0'dan büyük olmalıdır"),
  payment_type: z.enum(["hesap", "cek", "senet"]),
  payment_direction: z.enum(["incoming", "outgoing"]),
  account_type: z.enum(["cash", "bank", "credit_card", "partner"]).optional(),
  account_id: z.string().uuid().optional(),
  description: z.string().optional(),
  payment_date: z.date(),
  currency: z.enum(["TRY", "USD", "EUR", "GBP"]).default("TRY"),
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
  const { autoAllocatePayment } = usePaymentAllocation();
  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      payment_date: new Date(),
      payment_direction: "outgoing",
      payment_type: defaultPaymentType || "hesap",
      account_type: "bank",
      currency: "TRY",
    },
  });

  // defaultPaymentType değiştiğinde form'u güncelle
  useEffect(() => {
    if (defaultPaymentType) {
      form.setValue('payment_type', defaultPaymentType);
    }
  }, [defaultPaymentType, form]);

  // Dialog açılıp kapandığında formu sıfırla
  useEffect(() => {
    if (!open) {
      // Dialog kapandığında formu tamamen sıfırla
      form.reset({
        payment_date: new Date(),
        payment_direction: "outgoing",
        payment_type: defaultPaymentType || "hesap",
        account_type: "bank",
        currency: "TRY",
        amount: undefined,
        account_id: undefined,
        description: undefined,
      });
    }
  }, [open, form, defaultPaymentType]);

  // Tüm hesap türlerini fetch et (currency bilgisiyle birlikte)
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
        supabase.from('cash_accounts').select('id, name, currency').eq("is_active", true),
        supabase.from('bank_accounts').select('id, account_name, bank_name, currency').eq("is_active", true),
        supabase.from('credit_cards').select('id, card_name, currency').eq("status", "active"),
        supabase.from('partner_accounts').select('id, partner_name, currency').eq("is_active", true)
      ]);

      // Debug: Sorgu sonuçlarını logla
      if (bankRes.error) {
        logger.error('Banka hesapları sorgu hatası:', bankRes.error);
      }
      if (bankRes.data) {
        logger.debug('Banka hesapları:', bankRes.data.map(a => ({ id: a.id, name: a.account_name, currency: a.currency })));
      }

      return {
        cash: cashRes.data?.map(a => ({ id: a.id, label: a.name, currency: (a.currency || 'TRY').toUpperCase() })) || [],
        bank: bankRes.data?.map(a => ({ id: a.id, label: `${a.account_name} - ${a.bank_name}`, currency: (a.currency || 'TRY').toUpperCase() })) || [],
        credit_card: cardRes.data?.map(a => ({ id: a.id, label: a.card_name, currency: (a.currency || 'TRY').toUpperCase() })) || [],
        partner: partnerRes.data?.map(a => ({ id: a.id, label: a.partner_name, currency: (a.currency || 'TRY').toUpperCase() })) || []
      };
    },
  });

  useEffect(() => {
    if (!open) {
      form.reset({
        payment_date: new Date(),
        payment_direction: "outgoing",
        account_type: "bank",
        currency: "TRY",
      });
    }
  }, [open, form]);

  // Watch account type and currency changes to reset account selection
  const accountType = form.watch("account_type");
  const selectedCurrency = form.watch("currency");
  const selectedPaymentType = defaultPaymentType || "hesap";

  // Para birimi değiştiğinde hesap seçimini sıfırla
  useEffect(() => {
    if (selectedCurrency) {
      form.setValue("account_id", "");
    }
  }, [selectedCurrency, form]);

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
        currency: data.currency || "TRY",
        company_id: profile.company_id, // RLS için gerekli
      };

      // Hesap bilgisini ekle
      if (data.account_id && data.account_type) {
        paymentData.account_id = data.account_id;
        paymentData.account_type = data.account_type;
      }

      const { data: insertedPayment, error: paymentError } = await supabase
        .from("payments")
        .insert(paymentData)
        .select("id")
        .single();

      if (paymentError) throw paymentError;
      if (!insertedPayment) throw new Error("Ödeme kaydedilemedi");

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

      // 5. Otomatik FIFO tahsis (sadece giden ödemeler için - tedarikçiye ödeme)
      if (data.payment_direction === "outgoing" && insertedPayment.id) {
        try {
          await autoAllocatePayment.mutateAsync({ paymentId: insertedPayment.id, supplierId: supplier.id });
        } catch (allocError) {
          // Tahsis hatası ödeme kaydını engellemez, sadece log'lar
          logger.warn("Otomatik fatura tahsisinde hata:", allocError);
        }
      }

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
      queryClient.invalidateQueries({ queryKey: ["invoice-payment-status"] });
      queryClient.invalidateQueries({ queryKey: ["overdue-balances"] });
      queryClient.invalidateQueries({ queryKey: ["critical-alerts"] });
      
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
      logger.error("Payment error:", error);
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
        <form onSubmit={form.handleSubmit(onSubmit)}>
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
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Para Birimi <span className="text-red-500">*</span></FormLabel>
                    <Select onValueChange={(value) => {
                      field.onChange(value);
                      // Para birimi değiştiğinde hesap seçimini sıfırla
                      form.setValue("account_id", "");
                    }} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Para birimi seçin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="TRY">TRY</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                      </SelectContent>
                    </Select>
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
                render={({ field }) => {
                  // Seçilen para birimine göre hesapları filtrele
                  // NULL veya undefined currency değerleri TRY olarak kabul edilir
                  // Currency değerlerini uppercase yaparak karşılaştır (TRY vs try gibi durumlar için)
                  const normalizedCurrency = (selectedCurrency || 'TRY').toUpperCase();
                  
                  const filteredCash = accountType === 'cash' && selectedCurrency
                    ? accounts?.cash?.filter(acc => {
                        const accCurrency = (acc.currency || 'TRY').toUpperCase();
                        return accCurrency === normalizedCurrency;
                      }) || []
                    : [];
                  const filteredBank = accountType === 'bank' && selectedCurrency
                    ? accounts?.bank?.filter(acc => {
                        const accCurrency = (acc.currency || 'TRY').toUpperCase();
                        return accCurrency === normalizedCurrency;
                      }) || []
                    : [];
                  const filteredCreditCard = accountType === 'credit_card' && selectedCurrency
                    ? accounts?.credit_card?.filter(acc => {
                        const accCurrency = (acc.currency || 'TRY').toUpperCase();
                        return accCurrency === normalizedCurrency;
                      }) || []
                    : [];
                  const filteredPartner = accountType === 'partner' && selectedCurrency
                    ? accounts?.partner?.filter(acc => {
                        const accCurrency = (acc.currency || 'TRY').toUpperCase();
                        return accCurrency === normalizedCurrency;
                      }) || []
                    : [];

                  // Debug: Filtreleme sonuçlarını logla
                  if (accountType === 'bank' && selectedCurrency) {
                    logger.debug('Banka hesap filtreleme:', {
                      selectedCurrency: normalizedCurrency,
                      totalBanks: accounts?.bank?.length || 0,
                      filteredBanks: filteredBank.length,
                      bankCurrencies: accounts?.bank?.map(a => a.currency)
                    });
                  }

                  return (
                    <FormItem>
                      <FormLabel>Hesap <span className="text-red-500">*</span></FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-9 w-full">
                            <SelectValue placeholder={
                              ((accountType === 'cash' && filteredCash.length === 0) ||
                               (accountType === 'bank' && filteredBank.length === 0) ||
                               (accountType === 'credit_card' && filteredCreditCard.length === 0) ||
                               (accountType === 'partner' && filteredPartner.length === 0))
                                ? `${selectedCurrency} para biriminde hesap bulunamadı`
                                : "Hesap seçin"
                            } />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {accountType === 'cash' && filteredCash.length > 0 && filteredCash.map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.label}
                            </SelectItem>
                          ))}
                          {accountType === 'bank' && filteredBank.length > 0 && filteredBank.map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.label}
                            </SelectItem>
                          ))}
                          {accountType === 'credit_card' && filteredCreditCard.length > 0 && filteredCreditCard.map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.label}
                            </SelectItem>
                          ))}
                          {accountType === 'partner' && filteredPartner.length > 0 && filteredPartner.map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.label}
                            </SelectItem>
                          ))}
                          {((accountType === 'cash' && filteredCash.length === 0) ||
                            (accountType === 'bank' && filteredBank.length === 0) ||
                            (accountType === 'credit_card' && filteredCreditCard.length === 0) ||
                            (accountType === 'partner' && filteredPartner.length === 0)) && (
                            <div className="px-2 py-1.5 text-sm text-muted-foreground text-center">
                              {selectedCurrency} para biriminde hesap bulunamadı
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  );
                }}
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
                type="submit"
                variant="primary"
              >
                Kaydet
              </UnifiedDialogActionButton>
            </UnifiedDialogFooter>
          </div>
            </div>
        </form>
        </Form>
    </UnifiedDialog>
  );
}