import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery } from "@tanstack/react-query";
import { UnifiedDialog, UnifiedDialogFooter, UnifiedDialogActionButton, UnifiedDialogCancelButton } from "@/components/ui/unified-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EnhancedDatePicker } from "@/components/ui/enhanced-date-picker";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";

const loanSchema = z.object({
  loan_name: z.string().min(1, "Kredi adı gereklidir"),
  bank: z.string().min(1, "Banka gereklidir"),
  amount: z.number().positive("Tutar 0'dan büyük olmalıdır"),
  start_date: z.date(),
  installment_count: z.number().int().positive("Taksit sayısı 1'den büyük olmalıdır"),
  interest_rate: z.number().min(0, "Faiz oranı 0'dan küçük olamaz"),
  installment_amount: z.number().positive("Taksit tutarı 0'dan büyük olmalıdır"),
  notes: z.string().optional(),
  deposit_to_account: z.boolean().default(false),
  account_type: z.enum(["cash", "bank", "credit_card", "partner"]).optional(),
  account_id: z.string().uuid().optional(),
}).refine((data) => {
  // Eğer deposit_to_account true ise, account_type ve account_id zorunlu
  if (data.deposit_to_account) {
    return data.account_type && data.account_id;
  }
  return true;
}, {
  message: "Hesaba yatır seçiliyse hesap türü ve hesap seçimi zorunludur",
  path: ["account_id"],
});

type LoanFormData = z.infer<typeof loanSchema>;

interface Loan {
  id: string;
  loan_name: string;
  bank: string;
  amount: number;
  start_date: string;
  end_date: string;
  interest_rate: number;
  installment_amount: number;
  installment_count?: number;
  remaining_debt: number;
  status: string;
  notes?: string;
  created_at: string;
}

interface LoanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingLoan: Loan | null;
  onSubmit: (data: LoanFormData & { end_date: Date; remaining_debt: number; status: string }) => void;
  isLoading?: boolean;
}

export function LoanDialog({ open, onOpenChange, editingLoan, onSubmit, isLoading }: LoanDialogProps) {
  const { t } = useTranslation();
  
  const form = useForm<LoanFormData>({
    resolver: zodResolver(loanSchema),
    defaultValues: {
      loan_name: "",
      bank: "",
      amount: 0,
      start_date: new Date(),
      installment_count: 1,
      interest_rate: 0,
      installment_amount: 0,
      notes: "",
      deposit_to_account: false,
      account_type: "bank",
      account_id: undefined,
    },
  });

  // Tüm hesapları fetch et
  const { data: accounts } = useQuery({
    queryKey: ["payment-accounts"],
    queryFn: async () => {
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
        
        .order('account_type', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;

      const groupedAccounts = {
        bank: [],
        cash: [],
        credit_card: [],
        partner: []
      };

      data?.forEach(account => {
        let label = account.name;
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

  const depositToAccount = form.watch("deposit_to_account");
  const accountType = form.watch("account_type");

  // Dialog açılıp kapandığında ve editingLoan değiştiğinde formu güncelle
  useEffect(() => {
    if (open && editingLoan) {
      // Eğer loan'da installment_count varsa onu kullan, yoksa hesapla
      let installmentCount = editingLoan.installment_count;
      
      if (!installmentCount) {
        // Vade sonu ve başlangıç tarihinden taksit sayısını hesapla
        const startDate = new Date(editingLoan.start_date);
        const endDate = new Date(editingLoan.end_date);
        const monthsDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                          (endDate.getMonth() - startDate.getMonth());
        installmentCount = monthsDiff > 0 ? monthsDiff : 1;
      }
      
      form.reset({
        loan_name: editingLoan.loan_name,
        bank: editingLoan.bank,
        amount: editingLoan.amount,
        start_date: new Date(editingLoan.start_date),
        installment_count: installmentCount,
        interest_rate: editingLoan.interest_rate,
        installment_amount: editingLoan.installment_amount,
        notes: editingLoan.notes || "",
        deposit_to_account: false,
        account_type: "bank",
        account_id: undefined,
      });
    } else if (open && !editingLoan) {
      form.reset({
        loan_name: "",
        bank: "",
        amount: 0,
        start_date: new Date(),
        installment_count: 1,
        interest_rate: 0,
        installment_amount: 0,
        notes: "",
        deposit_to_account: false,
        account_type: "bank",
        account_id: undefined,
      });
    }
  }, [open, editingLoan, form]);

  const resetDialog = () => {
    form.reset({
      loan_name: "",
      bank: "",
      amount: 0,
      start_date: new Date(),
      installment_count: 1,
      interest_rate: 0,
      installment_amount: 0,
      notes: "",
      deposit_to_account: false,
      account_type: "bank",
    });
  };

  const handleSubmit = (data: LoanFormData) => {
    // Taksit sayısından vade sonu tarihini hesapla
    const startDate = new Date(data.start_date);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + data.installment_count);
    
    // Yeni kredi için remaining_debt = amount ve status = "odenecek", edit için mevcut değerleri koru
    const submitData = {
      ...data,
      end_date: endDate,
      remaining_debt: editingLoan?.remaining_debt ?? data.amount,
      status: editingLoan?.status ?? "odenecek",
    };
    
    onSubmit(submitData as any);
  };

  return (
    <UnifiedDialog
      isOpen={open}
      onClose={(isOpen) => onOpenChange(isOpen)}
      onClosed={resetDialog}
      title={editingLoan ? "Kredi Düzenle" : "Yeni Kredi Ekle"}
      maxWidth="xl"
      headerColor="indigo"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <div 
            className="grid grid-cols-2 gap-3 max-h-[70vh] overflow-y-auto pr-1"
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { 
                e.preventDefault(); 
                form.handleSubmit(handleSubmit)(); 
              }
              if (e.key === 'Escape') { 
                e.preventDefault(); 
                onOpenChange(false); 
              }
            }}
          >
            {/* Tüm Alanlar - 2 Sütun Grid Layout */}
            <FormField
              control={form.control}
              name="loan_name"
              render={({ field }) => (
                <FormItem className="space-y-0.5">
                  <FormLabel className="text-[11px]">Kredi Adı <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Örn: Konut Kredisi"
                      className="h-7 text-xs"
                      autoFocus
                    />
                  </FormControl>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bank"
              render={({ field }) => (
                <FormItem className="space-y-0.5">
                  <FormLabel className="text-[11px]">Banka <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Örn: Ziraat Bankası"
                      className="h-7 text-xs"
                    />
                  </FormControl>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="installment_amount"
              render={({ field }) => (
                <FormItem className="space-y-0.5">
                  <FormLabel className="text-[11px]">Aylık Taksit <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      value={field.value || ""}
                      placeholder="0.00"
                      className="h-7 text-xs"
                    />
                  </FormControl>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="installment_count"
              render={({ field }) => (
                <FormItem className="space-y-0.5">
                  <FormLabel className="text-[11px]">Taksit Sayısı <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="1"
                      min="1"
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                      value={field.value || ""}
                      placeholder="Örn: 12"
                      className="h-7 text-xs"
                    />
                  </FormControl>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="start_date"
              render={({ field }) => (
                <FormItem className="space-y-0.5">
                  <FormLabel className="text-[11px]">Vade Başlangıcı <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <EnhancedDatePicker
                      date={field.value}
                      onSelect={(newDate) => newDate && field.onChange(newDate)}
                      placeholder="Tarih seçin"
                      className="w-full h-7 text-xs"
                    />
                  </FormControl>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="interest_rate"
              render={({ field }) => (
                <FormItem className="space-y-0.5">
                  <FormLabel className="text-[11px]">Faiz Oranı (%) <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      value={field.value || ""}
                      placeholder="0.00"
                      className="h-7 text-xs"
                    />
                  </FormControl>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem className="space-y-0.5">
                  <FormLabel className="text-[11px]">Toplam Hesaba Geçen Tutar <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      value={field.value || ""}
                      placeholder="0.00"
                      className="h-7 text-xs"
                    />
                  </FormControl>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem className="space-y-0.5">
                  <FormLabel className="text-[11px]">Notlar</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Kredi ile ilgili notlarınız..."
                      className="h-7 text-xs"
                    />
                  </FormControl>
                  <FormMessage className="text-[10px]" />
                </FormItem>
              )}
            />

            {/* Hesaba Yatır Toggle - Tam Genişlik */}
            <div className="col-span-2 pt-2 pb-1 border-t">
              <FormField
                control={form.control}
                name="deposit_to_account"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between space-y-0">
                    <div className="space-y-0.5">
                      <FormLabel className="text-xs font-medium">Hesaba Yatır</FormLabel>
                      <p className="text-[10px] text-muted-foreground">
                        Kredi tutarını seçili hesaba yatır
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* Hesap Seçimi - Sadece Toggle Açıkken */}
            {depositToAccount && (
              <>
                <FormField
                  control={form.control}
                  name="account_type"
                  render={({ field }) => (
                    <FormItem className="space-y-0.5">
                      <FormLabel className="text-[11px]">Hesap Türü <span className="text-red-500">*</span></FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          form.setValue("account_id", undefined);
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue placeholder="Hesap türü seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="cash">💵 Kasa</SelectItem>
                          <SelectItem value="bank">🏦 Banka</SelectItem>
                          <SelectItem value="credit_card">💳 Kredi Kartı</SelectItem>
                          <SelectItem value="partner">🤝 Ortak Hesabı</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="account_id"
                  render={({ field }) => (
                    <FormItem className="space-y-0.5">
                      <FormLabel className="text-[11px]">Hesap <span className="text-red-500">*</span></FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue placeholder="Hesap seçin" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {accountType === 'cash' && accounts?.cash?.map((account: any) => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.label}
                            </SelectItem>
                          ))}
                          {accountType === 'bank' && accounts?.bank?.map((account: any) => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.label}
                            </SelectItem>
                          ))}
                          {accountType === 'credit_card' && accounts?.credit_card?.map((account: any) => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.label}
                            </SelectItem>
                          ))}
                          {accountType === 'partner' && accounts?.partner?.map((account: any) => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-[10px]" />
                    </FormItem>
                  )}
                />
              </>
            )}

            {/* Footer Buttons */}
            <div className="col-span-2 pt-2">
              <UnifiedDialogFooter>
                <UnifiedDialogCancelButton onClick={() => onOpenChange(false)} />
                <UnifiedDialogActionButton 
                  type="submit"
                  variant="primary"
                  disabled={isLoading}
                >
                  {isLoading ? "Kaydediliyor..." : editingLoan ? "Güncelle" : "Kaydet"}
                </UnifiedDialogActionButton>
              </UnifiedDialogFooter>
            </div>
          </div>

          {/* Footer with buttons - handled by UnifiedDialog */}
        </form>
      </Form>
    </UnifiedDialog>
  );
}

