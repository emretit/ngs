import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Employee } from "@/types/employee";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useToast } from "@/hooks/use-toast";
import { DatePicker } from "@/components/ui/date-picker";
import { format } from "date-fns";
import { useAllPaymentAccounts } from "@/hooks/useAccountDetail";

interface MakePaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee;
  currentBalance: number;
}

export const MakePaymentDialog = ({ open, onOpenChange, employee, currentBalance }: MakePaymentDialogProps) => {
  const { userData } = useCurrentUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { getAccountsByType } = useAllPaymentAccounts();

  const [paymentDate, setPaymentDate] = useState<Date>(new Date());
  const [amount, setAmount] = useState("");
  const [accountType, setAccountType] = useState<'cash' | 'bank' | 'credit_card' | 'partner'>('cash');
  const [accountId, setAccountId] = useState("");
  const [description, setDescription] = useState("");

  const makePaymentMutation = useMutation({
    mutationFn: async () => {
      if (!userData?.company_id) throw new Error("Company ID bulunamadı");
      if (!amount || parseFloat(amount) <= 0) throw new Error("Geçerli bir tutar girin");
      if (!accountId) throw new Error("Ödeme hesabı seçin");

      const reference = `EMP-PAYMENT-${employee.id}-${Date.now()}`;
      const paymentDescription = description || `Çalışan Ödemesi: ${employee.first_name} ${employee.last_name}`;

      if (accountType === 'cash') {
        const { error } = await supabase.from('cash_transactions').insert({
          account_id: accountId,
          company_id: userData.company_id,
          type: 'expense',
          amount: parseFloat(amount),
          description: paymentDescription,
          transaction_date: format(paymentDate, 'yyyy-MM-dd'),
          reference,
        });
        if (error) throw error;
      } else if (accountType === 'bank') {
        const { error } = await supabase.from('bank_transactions').insert({
          account_id: accountId,
          type: 'expense',
          amount: parseFloat(amount),
          description: paymentDescription,
          transaction_date: format(paymentDate, 'yyyy-MM-dd'),
          reference,
        });
        if (error) throw error;
      } else if (accountType === 'credit_card') {
        const { error } = await supabase.from('card_transactions').insert({
          card_id: accountId,
          transaction_type: 'expense',
          amount: parseFloat(amount),
          description: paymentDescription,
          transaction_date: format(paymentDate, 'yyyy-MM-dd'),
          reference_number: reference,
        });
        if (error) throw error;
      } else if (accountType === 'partner') {
        const { error } = await supabase.from('partner_transactions').insert({
          partner_id: accountId,
          type: 'expense',
          amount: parseFloat(amount),
          description: paymentDescription,
          transaction_date: format(paymentDate, 'yyyy-MM-dd'),
          reference,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Ödeme başarıyla yapıldı",
      });
      queryClient.invalidateQueries({ queryKey: ['employee-transactions', employee.id] });
      resetForm();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Hata",
        description: error.message || "Ödeme yapılırken hata oluştu",
      });
    },
  });

  const resetForm = () => {
    setPaymentDate(new Date());
    setAmount("");
    setAccountType('cash');
    setAccountId("");
    setDescription("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    makePaymentMutation.mutate();
  };

  const accounts = getAccountsByType(accountType);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Ödeme Yap</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="text-xs text-gray-600">Mevcut Bakiye</div>
            <div className={`text-lg font-bold ${currentBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {currentBalance.toLocaleString('tr-TR', {
                style: 'currency',
                currency: 'TRY'
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Ödeme Tarihi</Label>
            <DatePicker date={paymentDate} onSelect={(d) => d && setPaymentDate(d)} />
          </div>

          <div className="space-y-2">
            <Label>Ödeme Tutarı</Label>
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

          <div className="space-y-2">
            <Label>Açıklama (Opsiyonel)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ödeme açıklaması"
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              İptal
            </Button>
            <Button type="submit" disabled={makePaymentMutation.isPending}>
              {makePaymentMutation.isPending ? "Ödeme Yapılıyor..." : "Ödeme Yap"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
