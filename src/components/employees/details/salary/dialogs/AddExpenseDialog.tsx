import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Employee } from "@/types/employee";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useToast } from "@/hooks/use-toast";
import { DatePicker } from "@/components/ui/date-picker";
import { format } from "date-fns";
import { useAllPaymentAccounts } from "@/hooks/useAccountDetail";

interface AddExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee;
}

export const AddExpenseDialog = ({ open, onOpenChange, employee }: AddExpenseDialogProps) => {
  const { userData } = useCurrentUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { cashAccounts, bankAccounts, creditCards, partnerAccounts, getAccountsByType } = useAllPaymentAccounts();

  const [date, setDate] = useState<Date>(new Date());
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [payNow, setPayNow] = useState(false);
  const [accountType, setAccountType] = useState<'cash' | 'bank' | 'credit_card' | 'partner'>('cash');
  const [accountId, setAccountId] = useState("");

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['cashflow-categories', userData?.company_id],
    queryFn: async () => {
      if (!userData?.company_id) return [];
      const { data, error } = await supabase
        .from('cashflow_categories')
        .select('id, name')
        
        .eq('type', 'expense')
        .order('name');
      if (error) throw error;
      return data || [];
    },
    enabled: !!userData?.company_id,
  });

  const addExpenseMutation = useMutation({
    mutationFn: async () => {
      if (!userData?.company_id) throw new Error("Company ID bulunamadı");
      if (!amount || parseFloat(amount) <= 0) throw new Error("Geçerli bir tutar girin");
      if (!description) throw new Error("Açıklama girin");

      // 1. Masraf kaydı oluştur
      const { data: expense, error: expenseError } = await supabase
        .from('expenses')
        .insert({
          company_id: userData.company_id,
          employee_id: employee.id,
          expense_type: 'employee',
          type: 'expense',
          amount: parseFloat(amount),
          date: format(date, 'yyyy-MM-dd'),
          category_id: categoryId || null,
          description,
          is_paid: payNow,
          paid_date: payNow ? format(date, 'yyyy-MM-dd') : null,
          payment_account_type: payNow ? accountType : null,
          payment_account_id: payNow ? accountId : null,
        })
        .select()
        .single();

      if (expenseError) throw expenseError;

      // 2. Eğer "Hemen Öde" seçiliyse, ilgili hesaba transaction ekle
      if (payNow && expense) {
        const reference = `EXP-${expense.id}`;
        const transactionDesc = `Çalışan Masrafı: ${employee.first_name} ${employee.last_name} - ${description}`;

        if (accountType === 'cash') {
          const { error } = await supabase.from('cash_transactions').insert({
            account_id: accountId,
            company_id: userData.company_id,
            type: 'expense',
            amount: parseFloat(amount),
            description: transactionDesc,
            transaction_date: format(date, 'yyyy-MM-dd'),
            reference,
          });
          if (error) throw error;
        } else if (accountType === 'bank') {
          const { error } = await supabase.from('bank_transactions').insert({
            account_id: accountId,
            type: 'expense',
            amount: parseFloat(amount),
            description: transactionDesc,
            transaction_date: format(date, 'yyyy-MM-dd'),
            reference,
          });
          if (error) throw error;
        } else if (accountType === 'credit_card') {
          const { error } = await supabase.from('card_transactions').insert({
            card_id: accountId,
            transaction_type: 'expense',
            amount: parseFloat(amount),
            description: transactionDesc,
            transaction_date: format(date, 'yyyy-MM-dd'),
            reference_number: reference,
          });
          if (error) throw error;
        } else if (accountType === 'partner') {
          const { error } = await supabase.from('partner_transactions').insert({
            partner_id: accountId,
            type: 'expense',
            amount: parseFloat(amount),
            description: transactionDesc,
            transaction_date: format(date, 'yyyy-MM-dd'),
            reference,
          });
          if (error) throw error;
        }
      }

      return expense;
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Masraf başarıyla eklendi",
      });
      queryClient.invalidateQueries({ queryKey: ['employee-transactions', employee.id] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      resetForm();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Hata",
        description: error.message || "Masraf eklenirken hata oluştu",
      });
    },
  });

  const resetForm = () => {
    setDate(new Date());
    setAmount("");
    setCategoryId("");
    setDescription("");
    setPayNow(false);
    setAccountType('cash');
    setAccountId("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addExpenseMutation.mutate();
  };

  const accounts = getAccountsByType(accountType);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Masraf Ekle</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Tarih</Label>
            <DatePicker date={date} onSelect={(d) => d && setDate(d)} />
          </div>

          <div className="space-y-2">
            <Label>Tutar</Label>
            <Input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Kategori</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Kategori seçin" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Açıklama</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Masraf açıklaması"
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="payNow"
              checked={payNow}
              onCheckedChange={(checked) => setPayNow(checked as boolean)}
            />
            <Label htmlFor="payNow" className="cursor-pointer">Hemen Öde</Label>
          </div>

          {payNow && (
            <>
              <div className="space-y-2">
                <Label>Ödeme Yöntemi</Label>
                <Select value={accountType} onValueChange={(v) => {
                  setAccountType(v as any);
                  setAccountId("");
                }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Kasa</SelectItem>
                    <SelectItem value="bank">Banka</SelectItem>
                    <SelectItem value="credit_card">Kredi Kartı</SelectItem>
                    <SelectItem value="partner">Ortak</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Ödeme Hesabı</Label>
                <Select value={accountId} onValueChange={setAccountId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Hesap seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((acc) => (
                      <SelectItem key={acc.id} value={acc.id}>{acc.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              İptal
            </Button>
            <Button type="submit" disabled={addExpenseMutation.isPending}>
              {addExpenseMutation.isPending ? "Ekleniyor..." : "Ekle"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
