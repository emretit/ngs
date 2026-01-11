import React, { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Edit3,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  History,
} from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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

interface LoanPayment {
  id: string;
  loan_id: string;
  payment_date: string;
  payment_amount: number;
  notes?: string;
  created_at: string;
}

interface Installment {
  installment_number: number;
  due_date: string;
  amount: number;
  is_paid: boolean;
  paid_amount?: number;
  payment_id?: string;
  payment_date?: string;
}

// Taksit planını oluştur
const generateInstallmentPlan = (
  loan: Loan,
  payments: LoanPayment[]
): Installment[] => {
  if (!loan.installment_count || !loan.start_date) return [];

  const installments: Installment[] = [];
  const startDate = new Date(loan.start_date);
  const installmentAmount = loan.installment_amount;

  for (let i = 0; i < loan.installment_count; i++) {
    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + i);

    installments.push({
      installment_number: i + 1,
      due_date: dueDate.toISOString(),
      amount: installmentAmount,
      is_paid: false,
    });
  }

  // Ödemeleri taksitlere eşleştir
  let sortedPayments = [...payments].sort(
    (a, b) => new Date(a.payment_date).getTime() - new Date(b.payment_date).getTime()
  );

  for (const payment of sortedPayments) {
    let remainingPayment = payment.payment_amount;

    for (const installment of installments) {
      if (installment.is_paid) continue;

      const paidAmount = installment.paid_amount || 0;
      const remainingInstallment = installment.amount - paidAmount;

      if (remainingPayment >= remainingInstallment) {
        // Taksit tamamen ödendi
        installment.is_paid = true;
        installment.paid_amount = installment.amount;
        installment.payment_id = payment.id;
        installment.payment_date = payment.payment_date;
        remainingPayment -= remainingInstallment;
      } else if (remainingPayment > 0) {
        // Kısmi ödeme
        installment.paid_amount = paidAmount + remainingPayment;
        installment.payment_id = payment.id;
        installment.payment_date = payment.payment_date;
        remainingPayment = 0;
        break;
      }
    }
  }

  return installments;
};

interface LoanDetailSheetProps {
  loan: Loan | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (loan: Loan) => void;
}

const LoanDetailSheet: React.FC<LoanDetailSheetProps> = ({
  loan,
  open,
  onOpenChange,
  onEdit,
}) => {
  const queryClient = useQueryClient();
  const [expandedInstallment, setExpandedInstallment] = useState<number | null>(null);
  const [paymentAccountType, setPaymentAccountType] = useState<string>('bank');
  const [paymentAccountId, setPaymentAccountId] = useState<string>('');
  const [editingValues, setEditingValues] = useState<Partial<Loan>>({});

  // Fetch accounts
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
        .eq('company_id', profile.company_id)
        .order('account_type', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;

      const groupedAccounts = {
        bank: [] as Array<{ id: string; label: string }>,
        cash: [] as Array<{ id: string; label: string }>,
        credit_card: [] as Array<{ id: string; label: string }>,
        partner: [] as Array<{ id: string; label: string }>
      };

      data?.forEach(account => {
        let label = account.name;
        if (account.account_type === 'bank' && account.bank_name) {
          label = `${account.name} - ${account.bank_name}`;
        } else if (account.account_type === 'credit_card' && account.bank_name) {
          label = `${account.name} - ${account.bank_name}`;
        }
        groupedAccounts[account.account_type as keyof typeof groupedAccounts].push({
          id: account.id,
          label: label
        });
      });

      return groupedAccounts;
    },
  });

  // Fetch loan payments
  const { data: payments = [], isLoading: paymentsLoading } = useQuery({
    queryKey: ["loan-payments", loan?.id],
    queryFn: async () => {
      if (!loan?.id) return [];
      
      const { data, error } = await supabase
        .from("loan_payments")
        .select("*")
        .eq("loan_id", loan.id)
        .order("payment_date", { ascending: false });
      
      if (error) throw error;
      return (data as LoanPayment[]) || [];
    },
    enabled: !!loan?.id && open,
  });

  // Taksit planını oluştur
  const installments = loan ? generateInstallmentPlan(loan, payments) : [];

  // Create payment mutation
  const createPaymentMutation = useMutation({
    mutationFn: async (paymentData: {
      loan_id: string;
      payment_amount: number;
      payment_date: string;
      account_id: string;
      account_type: string;
      notes?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Kullanıcı bulunamadı");

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile?.company_id) throw new Error("Şirket bilgisi bulunamadı");

      // 1. Payment kaydı oluştur
      const { data: payment, error: paymentError } = await supabase
        .from("loan_payments")
        .insert({
          loan_id: paymentData.loan_id,
          payment_amount: paymentData.payment_amount,
          payment_date: paymentData.payment_date,
          account_id: paymentData.account_id,
          account_type: paymentData.account_type,
          notes: paymentData.notes,
        })
        .select()
        .single();
      
      if (paymentError) throw paymentError;

      // 2. Transaction kaydı oluştur (hesap tipine göre)
      let transactionId: string | null = null;
      const transactionDescription = `Kredi Ödemesi: ${loan?.loan_name || ''}`;
      const transactionDate = paymentData.payment_date;

      if (paymentData.account_type === 'bank') {
        const { data: transaction, error: transactionError } = await supabase
          .from('bank_transactions')
          .insert({
            account_id: paymentData.account_id,
            amount: paymentData.payment_amount,
            type: 'expense',
            description: transactionDescription,
            category: 'kredi_odemesi',
            reference: `LOAN-PAY-${payment.id}`,
            transaction_date: transactionDate,
            company_id: profile.company_id
          })
          .select()
          .single();
        
        if (transactionError) throw transactionError;
        transactionId = transaction.id;

        // Bakiye güncelle
        const { error: balanceError } = await supabase.rpc('update_bank_account_balance', {
          account_id: paymentData.account_id,
          amount: paymentData.payment_amount,
          transaction_type: 'expense'
        });
        if (balanceError) throw balanceError;
      } else if (paymentData.account_type === 'cash') {
        const { data: transaction, error: transactionError } = await supabase
          .from('cash_transactions')
          .insert({
            account_id: paymentData.account_id,
            amount: paymentData.payment_amount,
            type: 'expense',
            description: transactionDescription,
            category: 'kredi_odemesi',
            reference: `LOAN-PAY-${payment.id}`,
            transaction_date: transactionDate,
            company_id: profile.company_id
          })
          .select()
          .single();
        
        if (transactionError) throw transactionError;
        transactionId = transaction.id;

        // Bakiye güncelle
        const { error: balanceError } = await supabase.rpc('update_cash_account_balance', {
          p_account_id: paymentData.account_id,
          p_amount: paymentData.payment_amount,
          p_type: 'expense'
        });
        if (balanceError) throw balanceError;
      } else if (paymentData.account_type === 'credit_card') {
        const { data: transaction, error: transactionError } = await supabase
          .from('card_transactions')
          .insert({
            card_id: paymentData.account_id,
            amount: paymentData.payment_amount,
            transaction_type: 'purchase',
            description: transactionDescription,
            merchant_category: 'kredi_odemesi',
            reference_number: `LOAN-PAY-${payment.id}`,
            transaction_date: transactionDate,
            currency: 'TRY',
            company_id: profile.company_id
          })
          .select()
          .single();
        
        if (transactionError) throw transactionError;
        transactionId = transaction.id;

        // Bakiye güncelle
        const { error: balanceError } = await supabase.rpc('update_credit_card_balance', {
          card_id: paymentData.account_id,
          amount: paymentData.payment_amount,
          transaction_type: 'expense'
        });
        if (balanceError) throw balanceError;
      } else if (paymentData.account_type === 'partner') {
        const { data: transaction, error: transactionError } = await supabase
          .from('partner_transactions')
          .insert({
            account_id: paymentData.account_id,
            amount: paymentData.payment_amount,
            transaction_type: 'expense',
            description: transactionDescription,
            category: 'kredi_odemesi',
            reference: `LOAN-PAY-${payment.id}`,
            transaction_date: transactionDate,
            company_id: profile.company_id
          })
          .select()
          .single();
        
        if (transactionError) throw transactionError;
        transactionId = transaction.id;

        // Bakiye güncelle
        const { error: balanceError } = await supabase.rpc('update_partner_account_balance', {
          account_id: paymentData.account_id,
          amount: paymentData.payment_amount,
          transaction_type: 'expense'
        });
        if (balanceError) throw balanceError;
      }

      // 3. Payment'a transaction_id ekle
      if (transactionId) {
        await supabase
          .from("loan_payments")
          .update({ transaction_id: transactionId })
          .eq("id", payment.id);
      }

      // 4. Loan remaining_debt güncelle
      if (loan) {
        const newRemainingDebt = Math.max(0, loan.remaining_debt - paymentData.payment_amount);
        const newStatus = newRemainingDebt === 0 ? "odendi" : "odenecek";
        
        const { error: updateError } = await supabase
          .from("loans")
          .update({ 
            remaining_debt: newRemainingDebt,
            status: newStatus
          })
          .eq("id", paymentData.loan_id);
        
        if (updateError) throw updateError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loans"] });
      queryClient.invalidateQueries({ queryKey: ["loan-payments", loan?.id] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["payment-accounts"] });
      toast.success("Ödeme başarıyla kaydedildi");
      setExpandedInstallment(null);
      setPaymentAccountType('bank');
      setPaymentAccountId('');
    },
    onError: (error: any) => {
      toast.error("Ödeme kaydedilirken hata oluştu: " + (error.message || "Bilinmeyen hata"));
      console.error("Payment error:", error);
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY"
    }).format(amount);
  };

  const formatDate = (date: string) => {
    try {
      return format(new Date(date), "dd MMM yyyy", { locale: tr });
    } catch {
      return date;
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === "odendi") {
      return <Badge className="text-xs bg-green-600">Ödendi</Badge>;
    }
    return <Badge variant="destructive" className="text-xs">Ödenecek</Badge>;
  };

  // Taksit için ödeme yap
  const handleConfirmPayment = (installment: Installment) => {
    if (!paymentAccountId) {
      toast.error("Lütfen bir hesap seçiniz");
      return;
    }

    const unpaidAmount = installment.amount - (installment.paid_amount || 0);
    const paymentDate = new Date().toISOString().split('T')[0];
    const notes = `${installment.installment_number}. taksit ödemesi`;

    createPaymentMutation.mutate({
      loan_id: loan!.id,
      payment_amount: unpaidAmount,
      payment_date: paymentDate,
      account_id: paymentAccountId,
      account_type: paymentAccountType,
      notes: notes,
    });
  };

  React.useEffect(() => {
    if (loan) {
      setEditingValues(loan);
    }
  }, [loan]);

  const handleInputChange = (field: keyof Loan, value: any) => {
    setEditingValues(prev => ({ ...prev, [field]: value }));
  };

  if (!loan) return null;

  const totalPaid = payments.reduce((sum, payment) => sum + payment.payment_amount, 0);
  const paymentProgress = loan.amount > 0 ? ((totalPaid / loan.amount) * 100).toFixed(1) : 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange} modal={false}>
      <SheetContent className="sm:max-w-xl md:max-w-2xl overflow-hidden p-0 flex flex-col border-l border-gray-200 bg-white">
        <SheetHeader className="text-left border-b pb-1.5 mb-0 px-1.5 pt-1.5 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
            <SheetTitle className="text-lg font-semibold text-gray-900">Kredi Detayları</SheetTitle>
          </div>
        </SheetHeader>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto scrollbar-hide p-1.5">
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto scrollbar-hide pr-1 -mr-1">
              <div className="space-y-1.5">
                {/* Kredi Adı ve Banka */}
                <div className="grid grid-cols-2 gap-1.5">
                  <div className="space-y-0.5">
                    <Label htmlFor="loan_name" className="text-xs font-medium text-gray-700">Kredi Adı *</Label>
                    <Input
                      id="loan_name"
                      value={editingValues.loan_name || loan.loan_name || ""}
                      onChange={(e) => handleInputChange("loan_name", e.target.value)}
                      placeholder="Kredi adını girin"
                      className="h-10 text-xs"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <Label htmlFor="bank" className="text-xs font-medium text-gray-700">Banka *</Label>
                    <Input
                      id="bank"
                      value={editingValues.bank || loan.bank || ""}
                      onChange={(e) => handleInputChange("bank", e.target.value)}
                      placeholder="Banka adını girin"
                      className="h-10 text-xs"
                    />
                  </div>
                </div>

                {/* Tutar ve Taksit Bilgileri */}
                <div className="p-1 bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl border border-gray-100">
                  <div className="grid grid-cols-2 gap-1.5">
                    <div className="space-y-0.5">
                      <Label className="text-xs font-medium text-gray-600">Toplam Tutar</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={editingValues.amount ?? loan.amount}
                        onChange={(e) => handleInputChange("amount", parseFloat(e.target.value) || 0)}
                        className="h-10 text-xs"
                      />
                    </div>
                    <div className="space-y-0.5">
                      <Label className="text-xs font-medium text-gray-600">Aylık Taksit</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={editingValues.installment_amount ?? loan.installment_amount}
                        onChange={(e) => handleInputChange("installment_amount", parseFloat(e.target.value) || 0)}
                        className="h-10 text-xs"
                      />
                    </div>
                    <div className="space-y-0.5">
                      <Label className="text-xs font-medium text-gray-600">Taksit Sayısı</Label>
                      <Input
                        type="number"
                        step="1"
                        value={editingValues.installment_count ?? loan.installment_count ?? ""}
                        onChange={(e) => handleInputChange("installment_count", parseInt(e.target.value) || undefined)}
                        className="h-10 text-xs"
                      />
                    </div>
                    <div className="space-y-0.5">
                      <Label className="text-xs font-medium text-gray-600">Faiz Oranı (%)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={editingValues.interest_rate ?? loan.interest_rate}
                        onChange={(e) => handleInputChange("interest_rate", parseFloat(e.target.value) || 0)}
                        className="h-10 text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Tarih Bilgileri */}
                <div className="grid grid-cols-2 gap-1.5">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-medium text-gray-700">Vade Başlangıcı</Label>
                    <Input
                      type="date"
                      value={editingValues.start_date?.split('T')[0] || loan.start_date?.split('T')[0] || ""}
                      onChange={(e) => handleInputChange("start_date", e.target.value)}
                      className="h-10 text-xs"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <Label className="text-xs font-medium text-gray-700">Vade Sonu</Label>
                    <Input
                      type="date"
                      value={editingValues.end_date?.split('T')[0] || loan.end_date?.split('T')[0] || ""}
                      onChange={(e) => handleInputChange("end_date", e.target.value)}
                      className="h-10 text-xs"
                    />
                  </div>
                </div>

                {/* Durum ve Özet */}
                <div className="p-1 bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl border border-gray-100">
                  <div className="grid grid-cols-2 gap-1.5">
                    <div className="space-y-0.5">
                      <Label className="text-xs font-medium text-gray-600">Durum</Label>
                      <div className="h-10 flex items-center">
                        {getStatusBadge(loan.status)}
                      </div>
                    </div>
                    <div className="space-y-0.5">
                      <Label className="text-xs font-medium text-gray-600">Kalan Borç</Label>
                      <p className="text-base font-bold text-red-600 h-10 flex items-center">
                        {formatCurrency(loan.remaining_debt)}
                      </p>
                    </div>
                  </div>

                  {/* Payment Progress */}
                  <div className="pt-1.5 mt-1.5 border-t border-gray-200">
                    <div className="flex justify-between text-xs text-gray-600 mb-0.5">
                      <span>Ödeme İlerlemesi</span>
                      <span>{paymentProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${paymentProgress}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-0.5">
                      <span>Ödenen: {formatCurrency(totalPaid)}</span>
                      <span>Kalan: {formatCurrency(loan.remaining_debt)}</span>
                    </div>
                  </div>
                </div>

                {/* Notlar */}
                <div className="space-y-0.5">
                  <Label htmlFor="notes" className="text-xs font-medium text-gray-700">Notlar</Label>
                  <Textarea
                    id="notes"
                    value={editingValues.notes || loan.notes || ""}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    placeholder="Kredi ile ilgili notlarınız..."
                    rows={2}
                    className="resize-none min-h-[2.5rem] text-xs"
                  />
                </div>

                {/* Taksit Planı */}
                <div className="p-1.5 bg-white rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-gray-600" />
                      <h3 className="text-sm font-semibold text-gray-900">Taksit Planı</h3>
                    </div>
                    {installments.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {installments.filter(i => i.is_paid).length}/{installments.length} ödendi
                      </Badge>
                    )}
                  </div>
                  
                  {installments.length === 0 ? (
                    <div className="text-center py-4">
                      <Calendar className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                      <p className="text-xs text-gray-500">Taksit bilgisi bulunamadı</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {installments.map((installment) => {
                        const isPaid = installment.is_paid;
                        const isPartiallyPaid = !isPaid && (installment.paid_amount || 0) > 0;
                        const unpaidAmount = installment.amount - (installment.paid_amount || 0);
                        
                        return (
                          <div
                            key={installment.installment_number}
                            className={`flex items-center justify-between p-1.5 rounded-lg border transition-colors ${
                              isPaid
                                ? "bg-green-50 border-green-200"
                                : isPartiallyPaid
                                ? "bg-yellow-50 border-yellow-200"
                                : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                            }`}
                          >
                            <div className="flex items-center gap-1.5 flex-1">
                              {isPaid ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                              ) : isPartiallyPaid ? (
                                <Clock className="h-4 w-4 text-yellow-600 flex-shrink-0" />
                              ) : (
                                <AlertCircle className="h-4 w-4 text-gray-400 flex-shrink-0" />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <p className="text-xs font-semibold text-gray-900">
                                    {installment.installment_number}. Taksit
                                  </p>
                                  {isPaid && (
                                    <Badge className="text-xs h-5 bg-green-600 hover:bg-green-700">
                                      Ödendi
                                    </Badge>
                                  )}
                                  {isPartiallyPaid && (
                                    <Badge className="text-xs h-5 bg-yellow-600 hover:bg-yellow-700">
                                      Kısmi
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5 text-xs">
                                  <span className="text-gray-600">
                                    Vade: {formatDate(installment.due_date)}
                                  </span>
                                  <span className="font-medium text-gray-900">
                                    {formatCurrency(installment.amount)}
                                  </span>
                                  {isPartiallyPaid && (
                                    <span className="text-yellow-700 font-medium">
                                      Kalan: {formatCurrency(unpaidAmount)}
                                    </span>
                                  )}
                                </div>
                                {installment.payment_date && (
                                  <p className="text-xs text-green-700 mt-0.5">
                                    Ödeme: {formatDate(installment.payment_date)}
                                  </p>
                                )}
                              </div>
                            </div>
                            {!isPaid && (
                              <div className="ml-1.5 flex-shrink-0">
                                {expandedInstallment === installment.installment_number ? (
                                  <div className="flex flex-col gap-1.5 p-2 bg-blue-50 rounded border border-blue-200 min-w-[280px]">
                                    <div className="text-xs font-medium text-blue-900 mb-1">
                                      {installment.installment_number}. Taksit Ödemesi
                                    </div>
                                    <div className="grid grid-cols-2 gap-1.5">
                                      <Select
                                        value={paymentAccountType}
                                        onValueChange={(value) => {
                                          setPaymentAccountType(value);
                                          setPaymentAccountId('');
                                        }}
                                      >
                                        <SelectTrigger className="h-8 text-xs">
                                          <SelectValue placeholder="Hesap Tipi" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="cash">💵 Kasa</SelectItem>
                                          <SelectItem value="bank">🏦 Banka</SelectItem>
                                          <SelectItem value="credit_card">💳 Kredi Kartı</SelectItem>
                                          <SelectItem value="partner">🤝 Ortak</SelectItem>
                                        </SelectContent>
                                      </Select>
                                      
                                      <Select
                                        value={paymentAccountId}
                                        onValueChange={setPaymentAccountId}
                                      >
                                        <SelectTrigger className="h-8 text-xs">
                                          <SelectValue placeholder="Hesap Seç" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {accounts?.[paymentAccountType as keyof typeof accounts]?.map((acc: { id: string; label: string }) => (
                                            <SelectItem key={acc.id} value={acc.id}>
                                              {acc.label}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div className="text-xs text-gray-600">
                                      Tutar: {formatCurrency(installment.amount - (installment.paid_amount || 0))}
                                    </div>
                                    <div className="flex gap-1.5">
                                      <Button
                                        size="sm"
                                        onClick={() => handleConfirmPayment(installment)}
                                        className="flex-1 h-8 text-xs bg-blue-600 hover:bg-blue-700"
                                        disabled={createPaymentMutation.isPending || !paymentAccountId}
                                      >
                                        {createPaymentMutation.isPending ? "Kaydediliyor..." : "Onayla"}
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          setExpandedInstallment(null);
                                          setPaymentAccountId('');
                                        }}
                                        className="h-8 text-xs"
                                      >
                                        İptal
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant={isPartiallyPaid ? "default" : "outline"}
                                    className="h-8 text-xs"
                                    onClick={() => setExpandedInstallment(installment.installment_number)}
                                  >
                                    <DollarSign className="h-3 w-3 mr-0.5" />
                                    Öde
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Payment History */}
                <div className="p-1.5 bg-white rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <History className="h-4 w-4 text-gray-600" />
                  <h3 className="text-sm font-semibold text-gray-900">Ödeme Geçmişi</h3>
                </div>
                {payments.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {payments.length} ödeme
                  </Badge>
                )}
              </div>
              
              {paymentsLoading ? (
                <div className="text-center py-4">
                  <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-1"></div>
                  <p className="text-xs text-gray-500">Yükleniyor...</p>
                </div>
              ) : payments.length === 0 ? (
                <div className="text-center py-4">
                  <History className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                  <p className="text-xs text-gray-500">Henüz ödeme kaydı yok</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {payments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-start space-x-1.5 p-1.5 bg-gray-50 rounded-lg border border-gray-100"
                    >
                      <div className="p-1 rounded-full bg-green-100">
                        <CheckCircle2 className="h-3 w-3 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-900">
                            {formatCurrency(payment.payment_amount)}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDate(payment.payment_date)}
                          </span>
                        </div>
                        {payment.notes && (
                          <p className="text-xs text-gray-600 mt-0.5">{payment.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <SheetFooter className="flex justify-end gap-1.5 pt-1.5 px-1.5 pb-1.5 mt-auto border-t flex-shrink-0">
          <Button
            onClick={() => onOpenChange(false)}
            variant="outline"
            className="border-gray-200 text-gray-700 hover:bg-gray-50"
          >
            İptal
          </Button>
          <Button
            onClick={() => onEdit(loan)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Edit3 className="mr-2 h-4 w-4" />
            Düzenle
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default LoanDetailSheet;
