import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Download, Calculator } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface Loan {
  id: string;
  loan_name: string;
  bank: string;
  amount: number;
  start_date: string;
  end_date: string;
  interest_rate: number;
  installment_amount: number;
  remaining_debt: number;
  status: string;
  notes?: string;
  created_at: string;
}

const CashflowLoans = () => {
  const [loanDialog, setLoanDialog] = useState(false);
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);
  const [loanFilters, setLoanFilters] = useState({ status: "all", dateRange: "" });
  const [loanStatus, setLoanStatus] = useState("odenecek");
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch loans
  const { data: loans = [] } = useQuery({
    queryKey: ["loans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("loans")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return (data as unknown as Loan[]) || [];
    },
  });

  // Loan mutations
  const saveLoanMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const loanData = {
        loan_name: formData.get("loan_name") as string,
        bank: formData.get("bank") as string,
        amount: parseFloat(formData.get("amount") as string),
        start_date: formData.get("start_date") as string,
        end_date: formData.get("end_date") as string,
        interest_rate: parseFloat(formData.get("interest_rate") as string),
        installment_amount: parseFloat(formData.get("installment_amount") as string),
        remaining_debt: parseFloat(formData.get("remaining_debt") as string),
        status: formData.get("status") as string,
        notes: formData.get("notes") as string,
      };

      if (editingLoan) {
        const { error } = await supabase
          .from("loans")
          .update(loanData)
          .eq("id", editingLoan.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("loans")
          .insert([loanData]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loans"] });
      setLoanDialog(false);
      setEditingLoan(null);
      toast({ title: "Başarılı", description: "Kredi kaydedildi" });
    },
    onError: (error) => {
      toast({ title: "Hata", description: error.message, variant: "destructive" });
    },
  });

  // Delete mutations
  const deleteLoanMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("loans").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loans"] });
      toast({ title: "Başarılı", description: "Kredi silindi" });
    },
  });

  // Calculate summary data
  const totalLoanDebt = loans.reduce((sum, loan) => sum + loan.remaining_debt, 0);
  const totalLoanAmount = loans.reduce((sum, loan) => sum + loan.amount, 0);
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const thisMonthPayments = loans.filter(loan => {
    const endDate = new Date(loan.end_date);
    return endDate.getMonth() + 1 === currentMonth && endDate.getFullYear() === currentYear;
  }).reduce((sum, loan) => sum + loan.installment_amount, 0);
  const activeLoanCount = loans.filter(loan => loan.status === "odenecek").length;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY"
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      odenecek: { label: "Ödenecek", variant: "destructive" as const },
      odendi: { label: "Ödendi", variant: "default" as const },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const LoanForm = () => {
    const currentLoanStatus = editingLoan?.status || "odenecek";
    
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="loan_name">Kredi Adı</Label>
            <Input
              id="loan_name"
              name="loan_name"
              defaultValue={editingLoan?.loan_name || ""}
              required
            />
          </div>
          <div>
            <Label htmlFor="bank">Banka</Label>
            <Input
              id="bank"
              name="bank"
              defaultValue={editingLoan?.bank || ""}
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="amount">Kredi Tutarı</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              defaultValue={editingLoan?.amount || ""}
              required
            />
          </div>
          <div>
            <Label htmlFor="interest_rate">Faiz Oranı (%)</Label>
            <Input
              id="interest_rate"
              name="interest_rate"
              type="number"
              step="0.01"
              defaultValue={editingLoan?.interest_rate || ""}
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="start_date">Vade Başlangıcı</Label>
            <Input
              id="start_date"
              name="start_date"
              type="date"
              defaultValue={editingLoan?.start_date || ""}
              required
            />
          </div>
          <div>
            <Label htmlFor="end_date">Vade Sonu</Label>
            <Input
              id="end_date"
              name="end_date"
              type="date"
              defaultValue={editingLoan?.end_date || ""}
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="installment_amount">Aylık Taksit</Label>
            <Input
              id="installment_amount"
              name="installment_amount"
              type="number"
              step="0.01"
              defaultValue={editingLoan?.installment_amount || ""}
              required
            />
          </div>
          <div>
            <Label htmlFor="remaining_debt">Kalan Borç</Label>
            <Input
              id="remaining_debt"
              name="remaining_debt"
              type="number"
              step="0.01"
              defaultValue={editingLoan?.remaining_debt || ""}
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="status">Ödeme Durumu</Label>
            <Select 
              value={loanStatus} 
              onValueChange={setLoanStatus}
              defaultValue={currentLoanStatus}
            >
              <SelectTrigger>
                <SelectValue placeholder="Durum seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="odenecek">Ödenecek</SelectItem>
                <SelectItem value="odendi">Ödendi</SelectItem>
              </SelectContent>
            </Select>
            <input type="hidden" name="status" value={loanStatus} />
          </div>
        </div>
        <div>
          <Label htmlFor="notes">Notlar</Label>
          <Textarea
            id="notes"
            name="notes"
            defaultValue={editingLoan?.notes || ""}
            placeholder="Notlar..."
          />
        </div>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => setLoanDialog(false)}>
            İptal
          </Button>
          <Button
            onClick={(e) => {
              const form = e.currentTarget.closest("form") as HTMLFormElement;
              const formData = new FormData(form);
              saveLoanMutation.mutate(formData);
            }}
          >
            Kaydet
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 pl-12 bg-white rounded-md border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg text-white shadow-lg">
            <Calculator className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              Krediler
            </h1>
            <p className="text-xs text-muted-foreground/70">
              Kredi işlemlerinizi yönetin.
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="group relative overflow-hidden bg-white border border-red-100 hover:shadow-xl hover:shadow-red-500/10 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-red-50 to-rose-50"></div>
          <div className="absolute top-4 right-4">
            <div className="p-2 bg-red-500 rounded-lg shadow-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
          </div>
          <CardHeader className="relative pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">Toplam Kredi Borcu</CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl lg:text-3xl font-bold text-red-600 mb-2">
              {formatCurrency(totalLoanDebt)}
            </div>
            <div className="flex items-center gap-2">
              <div className="px-2 py-1 bg-red-100 rounded-full">
                <span className="text-xs font-medium text-red-700">Kalan borç</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden bg-white border border-blue-100 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50"></div>
          <div className="absolute top-4 right-4">
            <div className="p-2 bg-blue-500 rounded-lg shadow-lg">
              <Calculator className="w-5 h-5 text-white" />
            </div>
          </div>
          <CardHeader className="relative pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">Toplam Kredi Tutarı</CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl lg:text-3xl font-bold text-blue-600 mb-2">
              {formatCurrency(totalLoanAmount)}
            </div>
            <div className="flex items-center gap-2">
              <div className="px-2 py-1 bg-blue-100 rounded-full">
                <span className="text-xs font-medium text-blue-700">Toplam</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden bg-white border border-orange-100 hover:shadow-xl hover:shadow-orange-500/10 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-amber-50"></div>
          <div className="absolute top-4 right-4">
            <div className="p-2 bg-orange-500 rounded-lg shadow-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <CardHeader className="relative pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">Bu Ay Ödenecek</CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl lg:text-3xl font-bold text-orange-600 mb-2">
              {formatCurrency(thisMonthPayments)}
            </div>
            <div className="flex items-center gap-2">
              <div className="px-2 py-1 bg-orange-100 rounded-full">
                <span className="text-xs font-medium text-orange-700">Bu ay</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden bg-white border border-green-100 hover:shadow-xl hover:shadow-green-500/10 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50"></div>
          <div className="absolute top-4 right-4">
            <div className="p-2 bg-green-500 rounded-lg shadow-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <CardHeader className="relative pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">Aktif Kredi Sayısı</CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl lg:text-3xl font-bold text-green-600 mb-2">
              {activeLoanCount}
            </div>
            <div className="flex items-center gap-2">
              <div className="px-2 py-1 bg-green-100 rounded-full">
                <span className="text-xs font-medium text-green-700">Aktif</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 overflow-hidden">
        <div className="p-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex space-x-2">
                <Select
                  value={loanFilters.status}
                  onValueChange={(value) => setLoanFilters({ ...loanFilters, status: value })}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Durum filtresi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tümü</SelectItem>
                    <SelectItem value="odenecek">Ödenecek</SelectItem>
                    <SelectItem value="odendi">Ödendi</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Excel
                </Button>
              </div>
              <Dialog open={loanDialog} onOpenChange={setLoanDialog}>
                <DialogTrigger asChild>
                  <Button onClick={() => setEditingLoan(null)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Yeni Kredi
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {editingLoan ? "Kredi Düzenle" : "Yeni Kredi Ekle"}
                    </DialogTitle>
                  </DialogHeader>
                  <form>
                    <LoanForm />
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kredi Adı</TableHead>
                    <TableHead>Banka</TableHead>
                    <TableHead className="text-right">Tutar</TableHead>
                    <TableHead>Vade Başlangıcı</TableHead>
                    <TableHead>Vade Sonu</TableHead>
                    <TableHead className="text-right">Faiz Oranı</TableHead>
                    <TableHead className="text-right">Aylık Taksit</TableHead>
                    <TableHead className="text-right">Kalan Borç</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead className="text-center">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loans
                    .filter(loan => loanFilters.status === "all" || loan.status === loanFilters.status)
                    .map((loan) => (
                      <TableRow key={loan.id}>
                        <TableCell className="font-medium">{loan.loan_name}</TableCell>
                        <TableCell>{loan.bank}</TableCell>
                        <TableCell className="text-right">{formatCurrency(loan.amount)}</TableCell>
                        <TableCell>{format(new Date(loan.start_date), "dd/MM/yyyy")}</TableCell>
                        <TableCell>{format(new Date(loan.end_date), "dd/MM/yyyy")}</TableCell>
                        <TableCell className="text-right">%{loan.interest_rate}</TableCell>
                        <TableCell className="text-right">{formatCurrency(loan.installment_amount)}</TableCell>
                        <TableCell className="text-right font-bold text-red-600">
                          {formatCurrency(loan.remaining_debt)}
                        </TableCell>
                        <TableCell>{getStatusBadge(loan.status)}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingLoan(loan);
                                setLoanStatus(loan.status);
                                setLoanDialog(true);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteLoanMutation.mutate(loan.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CashflowLoans;
